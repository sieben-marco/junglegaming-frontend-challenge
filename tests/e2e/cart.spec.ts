import { expect, test, type Page } from '@playwright/test';
import {
  expectedTotal,
  formatEthLabel,
  multiplyEth,
  percentOfEth,
  pickMultiUnitEdition,
  requireNft,
} from './support/data';
import {
  addToCart,
  headingOf,
  openCartFromFeedback,
  openDetail,
  selectEdition,
  setMockScenario,
  summaryValue,
  visibleStepper,
} from './support/actions';

/**
 * Carrinho: inclusão (com merge), quantidade e remoção OTIMISTAS com rollback,
 * cupom (inválido/expirado/válido), totais vindos do "servidor" e persistência
 * após refresh (o carrinho vive no banco do MSW + localStorage).
 */
const NFT_ID = 'nft-001';
const nft = requireNft(NFT_ID);
const title = headingOf(nft);
/** Edição que aceita 2+ unidades (para exercitar quantidade). */
const edition = pickMultiUnitEdition(nft);

/** Detalhe → escolhe edição → compra → abre o carrinho pelo link do feedback. */
async function addAndOpenCart(page: Page): Promise<void> {
  await openDetail(page, NFT_ID);
  await selectEdition(page, edition.label);
  await addToCart(page);
  await openCartFromFeedback(page);
}

test('o item aparece no carrinho com os totais calculados pelo servidor', async ({ page }) => {
  await addAndOpenCart(page);

  const items = page.getByRole('region', { name: 'Itens do carrinho' });
  await expect(items.getByText(title, { exact: true })).toBeVisible();
  await expect(items.getByText(`Edição: ${edition.label}`)).toBeVisible();
  await expect(visibleStepper(page, title)).toHaveText('1');

  await expect(summaryValue(page, 'Subtotal')).toHaveText(formatEthLabel(nft.priceEth));
  await expect(summaryValue(page, 'Taxa de rede', false)).toHaveText(formatEthLabel('0.016'));
  await expect(summaryValue(page, 'Total')).toHaveText(formatEthLabel(expectedTotal(nft.priceEth)));
});

test('alterar a quantidade recalcula subtotal e total', async ({ page }) => {
  await addAndOpenCart(page);

  await page.getByRole('button', { name: `Aumentar Quantidade de ${title}` }).click();

  await expect(visibleStepper(page, title)).toHaveText('2');

  const subtotal = multiplyEth(nft.priceEth, 2);
  await expect(summaryValue(page, 'Subtotal')).toHaveText(formatEthLabel(subtotal));
  await expect(summaryValue(page, 'Total')).toHaveText(formatEthLabel(expectedTotal(subtotal)));
});

test('remover o item esvazia o carrinho e zera o contador', async ({ page }) => {
  await addAndOpenCart(page);

  await page.getByRole('button', { name: `Remover ${title} do carrinho` }).click();

  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Carrinho vazio' })).toBeVisible();
});

test('cupom inválido e expirado são recusados; válido aplica o desconto', async ({ page }) => {
  await addAndOpenCart(page);

  const code = page.getByLabel('Código promocional');
  const apply = page.getByRole('button', { name: 'Aplicar' });

  await code.fill('NAOEXISTE');
  await apply.click();
  await expect(page.getByRole('alert')).toHaveText('Código promocional inválido.');

  await code.fill('EXPIRADO10');
  await apply.click();
  await expect(page.getByRole('alert')).toHaveText('Este código promocional expirou.');

  // O servidor normaliza o código (aceita minúsculas).
  await code.fill('kurio10');
  await apply.click();

  await expect(page.getByText('KURIO10')).toBeVisible();
  await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText(
    `(-) ${formatEthLabel(percentOfEth(nft.priceEth, 10))}`,
  );
  await expect(summaryValue(page, 'Total')).toHaveText(formatEthLabel(expectedTotal(nft.priceEth, 10)));
});

test('o carrinho sobrevive ao refresh da página', async ({ page }) => {
  await addAndOpenCart(page);

  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText(title, { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Carrinho com 1 item' })).toBeVisible();
});

test('falha do servidor: a mudança otimista é revertida (rollback)', async ({ page }) => {
  await addAndOpenCart(page);

  // Latência maior deixa o estado OTIMISTA visível antes da resposta; e a
  // mutation falha para forçar o rollback (nada de "sucesso" falso).
  await setMockScenario(page, { cartLatencyMs: 1200, cartMutationFailure: true });

  await page.getByRole('button', { name: `Aumentar Quantidade de ${title}` }).click();

  // Otimista: a quantidade muda na hora...
  await expect(visibleStepper(page, title)).toHaveText('2');

  // ...mas o servidor recusa e a tela volta ao estado anterior.
  await expect(page.getByRole('alert')).toHaveText('Não foi possível atualizar o carrinho. Tente novamente.');
  await expect(visibleStepper(page, title)).toHaveText('1');
});
