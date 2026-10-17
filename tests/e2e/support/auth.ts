import { expect, type Page } from '@playwright/test';
import { DEMO_CREDENTIALS } from '../../../src/mocks/fixtures/users';

/**
 * Apoio dos testes de SESSÃO.
 *
 * As credenciais vêm das MESMAS fixtures que o "servidor" (MSW) usa — nada de
 * e-mail/senha "mágicos" escritos no teste.
 */
export { DEMO_CREDENTIALS };

/** O modal de login (o nome acessível vem do título "Entrar"). */
export function loginDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Entrar' });
}

/** O modal de cadastro (mesma moldura, título "Criar conta"). */
export function registerDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Criar conta' });
}

/** O botão do menu da conta no header (aparece só quando há usuário logado). */
export function userMenuButton(page: Page) {
  return page.getByRole('banner').getByRole('button', { name: /^Menu da conta de / });
}

/**
 * Sai da conta pelo menu do header e espera o app voltar ao estado de visitante.
 */
export async function logout(page: Page): Promise<void> {
  await userMenuButton(page).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Entrar' })).toBeVisible();
}

/** Preenche e envia o formulário de login (conta de demonstração por padrão). */
export async function submitLogin(
  page: Page,
  credentials: { email: string; password: string } = DEMO_CREDENTIALS,
): Promise<void> {
  const dialog = loginDialog(page);
  await expect(dialog).toBeVisible();

  // `exact: true` no rótulo da senha: o botão do "olho" se chama "Mostrar senha"
  // e também casaria com uma busca por substring.
  await dialog.getByLabel('E-mail', { exact: true }).fill(credentials.email);
  await dialog.getByLabel('Senha', { exact: true }).fill(credentials.password);
  await dialog.getByRole('button', { name: 'Entrar' }).click();
}

/**
 * Vence a sessão no "SERVIDOR" (ferramenta de dev), sem mexer no token do
 * cliente: é exatamente a situação de uma sessão que expira com o app aberto.
 *
 * Devolve quantas sessões foram vencidas (o teste confirma que havia uma).
 */
export async function expireSession(page: Page): Promise<number> {
  return page.evaluate(() => {
    const tools = (window as unknown as { __kurioMocks?: { expireSessions?: () => number } })
      .__kurioMocks;
    if (!tools?.expireSessions) {
      throw new Error('window.__kurioMocks.expireSessions não está disponível (mocks desligados?)');
    }
    return tools.expireSessions();
  });
}

/** Preenche e envia o formulário de CADASTRO. */
export async function submitRegister(
  page: Page,
  account: { username: string; email: string; password: string; confirmation?: string },
): Promise<void> {
  const dialog = registerDialog(page);
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Nome de usuário', { exact: true }).fill(account.username);
  await dialog.getByLabel('E-mail', { exact: true }).fill(account.email);
  await dialog.getByLabel('Senha', { exact: true }).fill(account.password);
  await dialog
    .getByLabel('Confirmar senha', { exact: true })
    .fill(account.confirmation ?? account.password);
  await dialog.getByRole('button', { name: 'Criar conta' }).click();
}
