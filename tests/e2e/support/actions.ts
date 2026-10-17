import { expect, type Page } from '@playwright/test';
import type { Nft } from '../../../src/types/nft';
import { requireNft } from './data';

/** Título como aparece na tela: "Emerald Ape #042". */
export function headingOf(nft: Nft): string {
  return `${nft.name} #${nft.number}`;
}

/** Abre o detalhe pela URL (deep link) e espera o dado carregar. */
export async function openDetail(page: Page, nftId: string): Promise<Nft> {
  const nft = requireNft(nftId);
  await page.goto(`/nft/${nft.id}`);
  await expect(page.getByRole('heading', { level: 1, name: headingOf(nft) })).toBeVisible();
  return nft;
}

/** Seleciona uma edição no grupo "Edição" (botões de alternância). */
export async function selectEdition(page: Page, label: string): Promise<void> {
  const button = page.getByRole('group', { name: 'Edição' }).getByRole('button', { name: new RegExp(`^${label}`) });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

/** Comprar pelo painel (desktop) e esperar o feedback de sucesso. */
export async function addToCart(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Comprar' }).click();
  // O feedback existe no painel E na barra do mobile; só um fica visível.
  await expect(successFeedback(page)).toBeVisible();
}

/** Mensagem de sucesso VISÍVEL na tela (painel ou barra fixa). */
export function successFeedback(page: Page) {
  return page.locator('p:visible').filter({ hasText: 'Adicionado ao carrinho.' });
}

/** Segue o link "Ver carrinho" do feedback e espera a tela do carrinho. */
export async function openCartFromFeedback(page: Page): Promise<void> {
  await page.locator('a:visible').filter({ hasText: 'Ver carrinho' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Carrinho de NFTs' })).toBeVisible();
}

/** Stepper visível da tela (garante que não há controles duplicados). */
export function visibleStepper(page: Page, title: string) {
  return page.locator(`[role="group"][aria-label="Quantidade de ${title}"]:visible`);
}

/**
 * Linha de valor do resumo: `dt` → `dd` irmão (ex.: Subtotal → 1.19 ETH).
 *
 * `exact: false` é para rótulos que têm elementos aninhados (ex.: "Taxa de rede"
 * contém a legenda "Taxa estimada") — nesse caso o texto do `dt` não é exato.
 */
export function summaryValue(page: Page, label: string, exact = true) {
  const dt = exact ? `dt:text-is("${label}")` : `dt:has-text("${label}")`;
  return page.locator(`${dt} + dd`);
}

/**
 * Ajusta os cenários dos mocks DENTRO da página (via `window.__kurioMocks`,
 * exposto apenas em DEV). É assim que exercitamos falha de rede/rollback de
 * forma honesta: a UI não tem "caminho alternativo", quem falha é o "servidor".
 */
export async function setMockScenario(
  page: Page,
  patch: Record<string, number | boolean>,
): Promise<void> {
  await page.evaluate((values) => {
    const tools = (window as unknown as { __kurioMocks?: { scenarios: Record<string, unknown> } })
      .__kurioMocks;
    if (!tools) throw new Error('window.__kurioMocks não está disponível (mocks desligados?)');
    Object.assign(tools.scenarios, values);
  }, patch);
}
