import { expect, test } from '@playwright/test';
import { requireNft } from './support/data';
import { headingOf } from './support/actions';

/**
 * Ações rápidas do card do catálogo.
 *
 * O card não tem seletor de edição (é pequeno): "Adicionar ao carrinho" usa a
 * MESMA edição padrão do detalhe, com quantidade 1 — e quem valida é o
 * servidor. Favoritar exige sessão, então sem login a UI encaminha para
 * `/entrar` guardando a URL atual (a busca/filtros continuam no `redirect`).
 */
const NFT_ID = 'nft-001';
const title = headingOf(requireNft(NFT_ID));

/** Abre o mercado já filtrado pelo NFT (a busca casa "Nome #Número"). */
async function openCatalogWithCard(page: import('@playwright/test').Page) {
  await page.goto(`/mercado?q=${encodeURIComponent(title)}`);
  const card = page.getByRole('article').filter({ hasText: title });
  await expect(card).toBeVisible();
  return card;
}

test('o card adiciona ao carrinho (edição padrão, quantidade 1)', async ({ page }) => {
  const card = await openCatalogWithCard(page);

  // As ações aparecem no hover; o teste passa pelo mesmo caminho do usuário.
  await card.hover();
  await card.getByRole('button', { name: `Adicionar ${title} ao carrinho` }).click();

  // Mensagem acessível (região viva) + contador do header vindo do servidor.
  await expect(card.getByRole('status')).toHaveText('Adicionado ao carrinho.');
  await expect(page.getByRole('link', { name: 'Carrinho com 1 item' })).toBeVisible();
});

test('favoritar no card sem sessão leva ao login mantendo a URL atual', async ({ page }) => {
  const card = await openCatalogWithCard(page);

  await card.hover();
  await card.getByRole('button', { name: `Favoritar ${title}` }).click();

  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fmercado/);
  await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
});
