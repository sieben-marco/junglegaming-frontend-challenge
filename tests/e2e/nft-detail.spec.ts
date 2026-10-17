import { expect, test } from '@playwright/test';
import { REVIEWS_BY_NFT } from '../../src/mocks/fixtures/nfts';
import {
  availabilityLabel,
  formatEthLabel,
  multiplyEth,
  pickMultiUnitEdition,
  requireNft,
} from './support/data';
import { headingOf, openDetail, selectEdition, visibleStepper } from './support/actions';

/**
 * Detalhe do NFT: dados da API, galeria com zoom, edições + quantidade,
 * abas (detalhes/avaliações), favorito (401 ⇒ login) e deep link inexistente.
 *
 * Os valores esperados saem das MESMAS fixtures que o MSW serve — nada de
 * número mágico que "passa por acaso".
 */
const NFT_ID = 'nft-001';
const nft = requireNft(NFT_ID);
const title = headingOf(nft);

test('exibe dados do NFT, edições e o zoom acessível', async ({ page }) => {
  await openDetail(page, NFT_ID);

  await expect(page.getByText(nft.collectionName, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(formatEthLabel(nft.priceEth), { exact: true }).first()).toBeVisible();
  await expect(page.getByText(availabilityLabel(nft))).toBeVisible();

  // Uma edição por item do contrato, e só UMA marcada como selecionada.
  const editions = page.getByRole('group', { name: 'Edição' });
  await expect(editions.getByRole('button')).toHaveCount(nft.editions.length);
  await expect(editions.locator('button[aria-pressed="true"]')).toHaveCount(1);

  // Um único stepper VISÍVEL no desktop (nada de controles duplicados).
  await expect(visibleStepper(page, title)).toHaveCount(1);

  // Zoom: abre dialog, fecha com Esc (foco preso vem do Base UI).
  await page.getByRole('button', { name: 'Ampliar imagem' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('quantidade no painel acompanha o total selecionado', async ({ page }) => {
  await openDetail(page, NFT_ID);

  // Escolhe uma edição que aceita 2+ unidades (1/1 tem teto 1).
  const edition = pickMultiUnitEdition(nft);
  await selectEdition(page, edition.label);

  await page.getByRole('button', { name: `Aumentar Quantidade de ${title}` }).click();

  await expect(visibleStepper(page, title)).toHaveText('2');
  await expect(page.getByText(/Total selecionado:/)).toContainText(
    formatEthLabel(multiplyEth(nft.priceEth, 2)),
  );
});

test('aba de avaliações mostra os reviews retornados pela API', async ({ page }) => {
  await openDetail(page, NFT_ID);

  await page.getByRole('tab', { name: /Avaliações de colecionadores/ }).click();

  const review = REVIEWS_BY_NFT[NFT_ID][0];
  await expect(page.getByText(review.author).first()).toBeVisible();
  await expect(page.getByText(review.comment).first()).toBeVisible();
});

test('favoritar sem sessão encaminha para o login (401, com redirect)', async ({ page }) => {
  await openDetail(page, NFT_ID);

  await page.getByRole('button', { name: 'Favoritar' }).click();

  await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=%2Fnft%2F${NFT_ID}`));
  await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible();
});

test('NFT inexistente mostra o estado de "não encontrado"', async ({ page }) => {
  await page.goto('/nft/nft-inexistente');

  await expect(page.getByRole('heading', { level: 1, name: 'NFT não encontrado' })).toBeVisible();
});
