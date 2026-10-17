import { expect, test } from '@playwright/test';
import { requireNft } from './support/data';
import { headingOf, openDetail, successFeedback, visibleStepper } from './support/actions';
import { submitLogin } from './support/auth';

/**
 * Fluxos MOBILE (rodam no projeto `mobile-chromium`, viewport de celular).
 *
 * No Figma, o mobile tem os controles de compra na BARRA FIXA do rodapé e o
 * favorito como coração sobre a imagem — o painel não repete os botões.
 */
const NFT_ID = 'nft-001';
const title = headingOf(requireNft(NFT_ID));

test('a barra fixa compra e atualiza o contador do carrinho', async ({ page }) => {
  await openDetail(page, NFT_ID);

  // Um único stepper visível: quantidade/compra vivem só na barra.
  await expect(visibleStepper(page, title)).toHaveCount(1);

  await page.getByRole('button', { name: 'Comprar NFT' }).click();

  await expect(successFeedback(page)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir carrinho com 1 item' })).toBeVisible();
});

test('o coração sobre a imagem favorita (e cai no login sem sessão)', async ({ page }) => {
  await openDetail(page, NFT_ID);

  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click();

  await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=%2Fnft%2F${NFT_ID}`));
});

test('entrar pelo login no mobile salva o favorito (sem voltar ao login)', async ({ page }) => {
  await openDetail(page, NFT_ID);
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click();

  // O MESMO modal de login (o Figma mostra uma tela própria no mobile; aqui o
  // diálogo ocupa a largura disponível e rola se não couber).
  await submitLogin(page);

  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click();
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible();
});
