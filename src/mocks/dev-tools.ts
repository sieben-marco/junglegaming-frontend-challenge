import { resetMockDb } from './db';
import { mockScenarios, resetMockScenarios, type MockScenarioConfig } from './scenarios';

/**
 * Ferramentas de desenvolvimento dos mocks.
 *
 * O enunciado pede cenários de rede/falha **configuráveis e reproduzíveis**.
 * Este módulo expõe os interruptores em `window.__kurioMocks` SOMENTE em
 * desenvolvimento (`import.meta.env.DEV`), permitindo:
 *   - trocar cenários pelo console (ou por um teste E2E);
 *   - restaurar o cenário padrão e o banco mockado.
 *
 * Nada disso entra no bundle de produção, e nenhum componente/hook lê
 * `mockScenarios` — a UI continua falando apenas com a "API".
 *
 * Uso no console do navegador:
 *   __kurioMocks.scenarios.cartMutationFailure = true;  // força falha no carrinho
 *   __kurioMocks.resetScenarios();                      // volta ao normal
 *   __kurioMocks.resetDb();                             // carrinho/favoritos limpos
 */
export interface KurioMockDevTools {
  /** Cenário ativo (mutável de propósito: é um interruptor de dev). */
  scenarios: MockScenarioConfig;
  /** Restaura o cenário padrão (determinístico). */
  resetScenarios: () => void;
  /** Restaura o "banco" simulado (carrinho e favoritos). */
  resetDb: () => void;
}

/** Disponibiliza as ferramentas em `window.__kurioMocks` (apenas em DEV). */
export function exposeMockDevTools(): void {
  if (!import.meta.env.DEV) return;

  const target = window as Window & { __kurioMocks?: KurioMockDevTools };
  target.__kurioMocks = {
    scenarios: mockScenarios,
    resetScenarios: resetMockScenarios,
    resetDb: resetMockDb,
  };
}
