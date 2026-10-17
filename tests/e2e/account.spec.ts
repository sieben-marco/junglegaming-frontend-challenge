import { expect, test } from '@playwright/test';
import { addToCart, headingOf, openCartFromFeedback, openDetail } from './support/actions';
import {
  DEMO_CREDENTIALS,
  logout,
  registerDialog,
  submitLogin,
  submitRegister,
  userMenuButton,
} from './support/auth';
import { requireNft } from './support/data';

/**
 * CONTA: cadastro (com validação e conflito) e logout (limpando o cache
 * privado). É a segunda metade da sessão — a primeira (login) está em
 * `auth.spec.ts`.
 */

const NFT_ID = 'nft-001';
const nft = requireNft(NFT_ID);
const title = headingOf(nft);

/** Conta que o teste CRIA (não existe nas fixtures do "servidor"). */
const NEW_ACCOUNT = {
  username: 'novacolecionador',
  email: 'nova@kurio.art',
  password: 'segredo123',
};

test('cadastro cria a conta, entra e volta ao fluxo anterior', async ({ page }) => {
  await page.goto(`/cadastro?redirect=/nft/${NFT_ID}`);

  // A tela de cadastro é o MESMO modal, com a aba "Criar conta" ativa.
  await expect(registerDialog(page)).toBeVisible();
  await submitRegister(page, NEW_ACCOUNT);

  // Voltou para o NFT que a pessoa estava vendo, já autenticada (o header mostra
  // a conta nova) — cadastro e sessão integrados, como o enunciado pede.
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(userMenuButton(page)).toHaveAccessibleName(
    `Menu da conta de ${NEW_ACCOUNT.username}`,
  );
});

test('cadastro com e-mail já usado mostra o conflito no campo (409)', async ({ page }) => {
  await page.goto('/cadastro');
  await submitRegister(page, {
    ...NEW_ACCOUNT,
    username: 'outronome',
    email: DEMO_CREDENTIALS.email,
  });

  // A mensagem do servidor aparece E o campo certo fica destacado.
  await expect(registerDialog(page).getByRole('alert')).toHaveText('Este e-mail já está em uso.');
  await expect(
    registerDialog(page).getByText('Já existe uma conta com este e-mail.'),
  ).toBeVisible();

  // E ninguém foi autenticado às escondidas: fechando o modal, o header segue
  // de visitante (enquanto o diálogo está aberto, o resto da página fica fora da
  // árvore de acessibilidade — por isso a checagem vem DEPOIS do `Esc`).
  await page.keyboard.press('Escape');
  await expect(page.getByRole('banner').getByRole('link', { name: 'Entrar' })).toBeVisible();
});

test('confirmação de senha diferente barra o envio sem chamar a API', async ({ page }) => {
  let registrations = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/register')) registrations += 1;
  });

  await page.goto('/cadastro');
  await submitRegister(page, { ...NEW_ACCOUNT, confirmation: 'outra-senha' });

  await expect(registerDialog(page).getByText('As senhas não conferem.')).toBeVisible();
  expect(registrations).toBe(0);
});

test('logout limpa o cache privado (carrinho e favoritos) e volta a visitante', async ({
  page,
}) => {
  await page.goto(`/entrar?redirect=/nft/${NFT_ID}`);
  await submitLogin(page);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();

  // Com sessão de verdade: favorito salvo (esperando a RESPOSTA, e não o estado
  // otimista) e um item no carrinho DO USUÁRIO.
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes('/api/favorites') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click();
  await saved;

  await addToCart(page);
  await openCartFromFeedback(page);
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText(title, { exact: true }),
  ).toBeVisible();

  await logout(page);

  // O item do usuário NÃO pode continuar aparecendo: o cache privado era dele.
  // (O carrinho volta a ser o do VISITANTE, que está vazio.)
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText(title, { exact: true }),
  ).toBeHidden();

  // A sessão acabou também no "servidor": favoritar agora cai no login.
  await openDetail(page, NFT_ID);
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=%2Fnft%2F${NFT_ID}`));
});
