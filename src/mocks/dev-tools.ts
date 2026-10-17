import { expireSessions, resetMockDb } from './db';
import { changeNftPrice, connectedClientCount, disconnectClients, emitNftUpdate } from './realtime';
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
  /** Restaura o "banco" simulado (carrinho, favoritos e mudanças de NFT). */
  resetDb: () => void;
  /**
   * Ação do "SERVIDOR": muda o preço de um NFT e emite `nft.updated` para quem
   * estiver conectado (o evento chega pelo socket de verdade).
   */
  changeNftPrice: typeof changeNftPrice;
  /** Reenvia um evento JÁ gerado — para testar duplicata/evento fora de ordem. */
  emitNftUpdate: typeof emitNftUpdate;
  /** Conexões Socket.IO abertas (o "servidor" vê quem está escutando). */
  connectedClientCount: typeof connectedClientCount;
  /**
   * Derruba todas as conexões (simula queda de rede) — o app só volta quando o
   * socket reconectar sozinho. Serve para exercitar a reconciliação.
   */
  disconnectClients: typeof disconnectClients;
  /**
   * Vence TODAS as sessões agora (o cliente continua com o token, mas o
   * "servidor" o recusa) — para exercitar a expiração durante a navegação.
   */
  expireSessions: typeof expireSessions;
}

/** Disponibiliza as ferramentas em `window.__kurioMocks` (apenas em DEV). */
export function exposeMockDevTools(): void {
  if (!import.meta.env.DEV) return;

  const target = window as Window & { __kurioMocks?: KurioMockDevTools };
  target.__kurioMocks = {
    scenarios: mockScenarios,
    resetScenarios: resetMockScenarios,
    resetDb: resetMockDb,
    changeNftPrice,
    emitNftUpdate,
    connectedClientCount,
    disconnectClients,
    expireSessions,
  };
}
