import { expect, test, type Page } from '@playwright/test';
import { formatEthLabel } from '../../src/lib/eth';
import { NFT_PRICE_BOUNDS } from '../../src/mocks/fixtures/nfts';
import type { Nft } from '../../src/types/nft';
import { addToCart, headingOf, openCartFromFeedback, openDetail, summaryValue } from './support/actions';
import { expectedTotal, requireNft } from './support/data';
import {
  serverChangesNftPrice,
  serverDropsConnectionsAndChangesPrice,
  serverReplaysNftUpdate,
  waitForCartFetchToSettle,
  waitForRealtimeConnection,
} from './support/realtime';

/**
 * TEMPO REAL (`nft.updated` via Socket.IO).
 *
 * O que estes testes provam: quando o "servidor" muda o preço de um NFT, o app
 * QUE JÁ ESTÁ ABERTO mostra o valor novo sem recarregar a página — e um evento
 * repetido/atrasado NÃO faz a tela "voltar no tempo".
 *
 * O caminho exercitado é o de verdade: `socket.io-client` conectado no mock
 * (`@mswjs/socket.io-binding`) e o dado aplicado no cache do React Query.
 */
const NFT_ID = 'nft-001';
const nft = requireNft(NFT_ID);
const title = headingOf(nft);

/**
 * Dois preços para o cenário, garantidos diferentes do preço atual e do
 * "antes" (riscado) — assim "não deveria aparecer na tela" é uma asserção
 * honesta, em vez de uma coincidência.
 */
function pickRealtimePrices(target: Nft): [string, string] {
  const used = new Set<string>([formatEthLabel(target.priceEth)]);
  if (target.previousPriceEth) used.add(formatEthLabel(target.previousPriceEth));

  const free = [String(NFT_PRICE_BOUNDS.min), String(NFT_PRICE_BOUNDS.max)].filter(
    (value) => !used.has(formatEthLabel(value)),
  );
  if (free.length < 2) throw new Error('Sem preços livres para o cenário de tempo real');
  return [free[0], free[1]];
}

const [priceA, priceB] = pickRealtimePrices(nft);

/** Abre o mercado já filtrado pelo NFT e devolve o card (o socket é esperado antes). */
async function openCatalogCard(page: Page) {
  await page.goto(`/mercado?q=${encodeURIComponent(title)}`);
  const card = page.getByRole('article').filter({ hasText: title });
  await expect(card).toBeVisible();
  await waitForRealtimeConnection(page);
  return card;
}

test('nft.updated atualiza o preço do detalhe sem recarregar', async ({ page }) => {
  await openDetail(page, NFT_ID);
  await waitForRealtimeConnection(page);

  await expect(page.getByText(formatEthLabel(nft.priceEth), { exact: true }).first()).toBeVisible();

  const event = await serverChangesNftPrice(page, { id: NFT_ID, priceEth: priceA });

  await expect(
    page.getByText(formatEthLabel(event.priceEth), { exact: true }).first(),
  ).toBeVisible();
});

test('nft.updated atualiza o card do catálogo sem recarregar', async ({ page }) => {
  const card = await openCatalogCard(page);

  await expect(card.getByText(formatEthLabel(nft.priceEth), { exact: true })).toBeVisible();

  const event = await serverChangesNftPrice(page, { id: NFT_ID, priceEth: priceB });

  await expect(card.getByText(formatEthLabel(event.priceEth), { exact: true })).toBeVisible();
});

test('evento antigo ou duplicado não regride o preço', async ({ page }) => {
  const card = await openCatalogCard(page);

  // Duas mudanças reais, em ordem: v1 depois v2.
  const first = await serverChangesNftPrice(page, { id: NFT_ID, priceEth: priceA });
  await expect(card.getByText(formatEthLabel(first.priceEth), { exact: true })).toBeVisible();

  const second = await serverChangesNftPrice(page, { id: NFT_ID, priceEth: priceB });
  await expect(card.getByText(formatEthLabel(second.priceEth), { exact: true })).toBeVisible();

  // Reentrega do evento ANTIGO (v1): precisa ser IGNORADO.
  await serverReplaysNftUpdate(page, first);
  await expect(card.getByText(formatEthLabel(second.priceEth), { exact: true })).toBeVisible();
  await expect(card.getByText(formatEthLabel(first.priceEth), { exact: true })).toHaveCount(0);

  // DUPLICATA do evento atual (v2): idempotente, nada muda.
  await serverReplaysNftUpdate(page, second);
  await expect(card.getByText(formatEthLabel(second.priceEth), { exact: true })).toBeVisible();
  await expect(card.getByText(formatEthLabel(first.priceEth), { exact: true })).toHaveCount(0);
});

test('nft.updated atualiza a linha, avisa a mudança e recalcula o resumo', async ({ page }) => {
  await openDetail(page, NFT_ID);
  await waitForRealtimeConnection(page);

  // Compra pelo painel (edição padrão, quantidade 1) e vai para o carrinho.
  await addToCart(page);
  await openCartFromFeedback(page);

  const items = page.getByRole('region', { name: 'Itens do carrinho' });
  const row = items.getByRole('listitem').filter({ hasText: title });

  // Estado inicial: resumo com o preço da fixture e SEM aviso de remarcação.
  await expect(summaryValue(page, 'Subtotal')).toHaveText(formatEthLabel(nft.priceEth));
  await expect(row.getByText(/Preço atualizado/)).toHaveCount(0);

  // Só com o carrinho QUIETO (nenhuma busca em voo) o evento é honesto: assim a
  // única forma de a tela mudar é o listener de tempo real atualizar o cache.
  await waitForCartFetchToSettle(page);

  const event = await serverChangesNftPrice(page, { id: NFT_ID, priceEth: priceA });

  // Sem recarregar: a LINHA passa a avisar o preço novo (é o texto do design,
  // e só aparece quando o preço atual difere do preço da inclusão)…
  await expect(
    row.getByText(`Preço atualizado para ${formatEthLabel(event.priceEth)}.`),
  ).toBeVisible();

  // …o resumo é recalculado com a MESMA regra do servidor (valor × qtd + taxa)…
  await expect(summaryValue(page, 'Subtotal')).toHaveText(formatEthLabel(event.priceEth));
  await expect(summaryValue(page, 'Total')).toHaveText(formatEthLabel(expectedTotal(event.priceEth)));

  // …e leitores de tela são avisados do motivo (região viva sempre montada).
  await expect(
    page.getByRole('status').filter({ hasText: 'Preço atualizado em 1 item(ns) do carrinho.' }),
  ).toBeVisible();
});

test('queda de conexão: ao reconectar, o app se reconcilia com o REST', async ({ page }) => {
  const card = await openCatalogCard(page);
  await expect(card.getByText(formatEthLabel(nft.priceEth), { exact: true })).toBeVisible();

  // O "servidor" cai E muda o preço: com todos fora, o evento não chega a
  // ninguém (é o que acontece de verdade quando o Wi-Fi do usuário oscila).
  const missed = await serverDropsConnectionsAndChangesPrice(page, { id: NFT_ID, priceEth: priceA });

  // Sem conexão, nada de tempo real: a tela continua com o preço antigo…
  await expect(card.getByText(formatEthLabel(nft.priceEth), { exact: true })).toBeVisible();

  // …até o socket reconectar sozinho. Aí o app revalida com o REST (fonte da
  // verdade) e passa a mostrar o preço novo — que NUNCA veio por evento.
  await waitForRealtimeConnection(page);
  await expect(card.getByText(formatEthLabel(missed.priceEth), { exact: true })).toBeVisible();
});
