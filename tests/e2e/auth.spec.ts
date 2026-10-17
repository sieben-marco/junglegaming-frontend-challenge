import { expect, test, type Page } from '@playwright/test';
import { addToCart, headingOf, openDetail } from './support/actions';
import { DEMO_CREDENTIALS, expireSession, loginDialog, submitLogin } from './support/auth';
import { requireNft } from './support/data';

/**
 * SESSÃO (login):
 *  - retorno ao fluxo anterior depois de entrar (o `redirect`);
 *  - sessão RECUPERADA após refresh (token + `GET /api/auth/session`);
 *  - favoritos de verdade (antes só existia o 401 → login);
 *  - carrinho do VISITANTE preservado ao autenticar;
 *  - EXPIRAÇÃO durante a navegação, com o contexto preservado para retomada;
 *  - validação no cliente antes de chamar a API.
 */
const NFT_ID = 'nft-001';
const nft = requireNft(NFT_ID);
const title = headingOf(nft);

/**
 * Espera a tela do detalhe (a prova de que voltamos ao fluxo anterior).
 *
 * Deliberadamente NÃO comparamos a URL com um regex: `.../nft/nft-001` também
 * "termina" a URL de `/entrar?redirect=/nft/nft-001`, e um teste que passa por
 * causa disso não prova nada.
 */
function expectDetail(page: Page) {
  return expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}

test('favoritar sem sessão leva ao login e, depois de entrar, salva de verdade', async ({
  page,
}) => {
  await openDetail(page, NFT_ID);

  // Visitante: o "servidor" responde 401 e a UI leva ao login guardando a URL.
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=%2Fnft%2F${NFT_ID}`));

  await submitLogin(page);

  // Voltou para o fluxo anterior (o detalhe) e o favorito agora é salvo…
  await expectDetail(page);

  // A estrela é OTIMISTA: ela muda na hora, antes de o servidor responder.
  // Então, antes de recarregar, esperamos a RESPOSTA do POST — senão o refresh
  // pode interromper uma requisição ainda em voo e o favorito nunca é gravado.
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes('/api/favorites') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await saved;

  // …e continua salvo depois do refresh: a sessão foi RECUPERADA pelo token.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('a sessão é recuperada do token depois de um refresh', async ({ page }) => {
  await page.goto('/entrar');
  await submitLogin(page);
  await expect(loginDialog(page)).toBeHidden();

  // Navegação "do zero" (recarrega o app): o token está no `localStorage`, e o
  // app volta a perguntar QUEM SOU EU ao servidor. Um 200 aqui prova as duas
  // pontas: o Axios reenviou o token e o "servidor" reconheceu a sessão.
  const sessionResponse = page.waitForResponse((response) =>
    response.url().includes('/api/auth/session'),
  );
  await page.goto('/mercado');
  const response = await sessionResponse;

  expect(response.status()).toBe(200);
  expect((await response.json()).user.email).toBe(DEMO_CREDENTIALS.email);
});

test('credenciais inválidas mostram o erro do servidor e não autenticam', async ({ page }) => {
  await page.goto('/entrar');

  await submitLogin(page, { email: DEMO_CREDENTIALS.email, password: 'senha-errada' });

  await expect(loginDialog(page).getByRole('alert')).toHaveText('E-mail ou senha inválidos.');
  // Continua visitante: o modal segue aberto.
  await expect(loginDialog(page)).toBeVisible();
});

test('a validação do formulário barra o envio antes de chamar a API', async ({ page }) => {
  let loginRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/login')) loginRequests += 1;
  });

  await page.goto('/entrar');
  await loginDialog(page).getByRole('button', { name: 'Entrar' }).click();

  await expect(loginDialog(page).getByText('Informe seu e-mail.')).toBeVisible();
  await expect(loginDialog(page).getByText('Informe sua senha.')).toBeVisible();
  expect(loginRequests).toBe(0);
});

test('os itens do visitante passam para o carrinho do usuário ao entrar', async ({ page }) => {
  await openDetail(page, NFT_ID);
  await addToCart(page); // compra como VISITANTE (carrinho do escopo "guest")

  await page.goto('/entrar?redirect=/carrinho');
  await submitLogin(page);

  // Voltou para o carrinho e o item continua lá: o "servidor" mesclou o
  // carrinho do visitante no do usuário (requisito do enunciado).
  await expect(page.getByRole('heading', { level: 1, name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText(title, { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Carrinho com 1 item' })).toBeVisible();
});

test('sessão expirada durante a navegação volta a pedir login e retoma o contexto', async ({
  page,
}) => {
  await page.goto(`/entrar?redirect=/nft/${NFT_ID}`);
  await submitLogin(page);
  await expectDetail(page);

  // O "servidor" vence a sessão; o cliente AINDA tem o token guardado.
  expect(await expireSession(page)).toBe(1);

  // A ação privada recebe 401 ⇒ o app volta a ser visitante e pede login de
  // novo, guardando ONDE estávamos.
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=%2Fnft%2F${NFT_ID}`));
  await expect(loginDialog(page)).toBeVisible();

  // Retomada: entrando de novo, voltamos exatamente para o detalhe.
  await submitLogin(page);
  await expectDetail(page);
});
