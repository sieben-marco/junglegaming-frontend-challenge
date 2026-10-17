/**
 * Cenários configuráveis dos mocks (MSW).
 *
 * O enunciado exige que condições de rede e falhas sejam configuráveis e
 * reproduzíveis. Em vez de espalhar "ifs" mágicos pelos handlers, centralizamos
 * os interruptores aqui. Numa etapa futura expomos um painel de dev que escreve
 * neste objeto (e um reset que restaura o cenário conhecido).
 *
 * IMPORTANTE: só os MOCKS leem isto. Componentes/hooks/axios nunca consultam
 * este módulo — senão a UI teria "caminhos alternativos de negócio".
 */
export interface MockScenarioConfig {
  /** Latência simulada (ms) das respostas de catálogo — exercita os skeletons. */
  catalogLatencyMs: number;
  /** Faz `GET /api/nfts` responder 500 (falha transitória). */
  catalogFailure: boolean;
  /** Faz `GET /api/nfts` responder uma lista vazia (estado vazio). */
  catalogEmpty: boolean;
  /** Latência simulada (ms) das respostas do carrinho. */
  cartLatencyMs: number;
  /** Faz as MUTATIONS do carrinho falharem (exercita o rollback otimista). */
  cartMutationFailure: boolean;
  /** Faz qualquer chamada REST falhar como falha de REDE (sem resposta). */
  networkError: boolean;
}

/** Cenário padrão (conhecido e determinístico). */
export const DEFAULT_MOCK_SCENARIOS: MockScenarioConfig = {
  catalogLatencyMs: 400,
  catalogFailure: false,
  catalogEmpty: false,
  cartLatencyMs: 300,
  cartMutationFailure: false,
  networkError: false,
};

export const mockScenarios: MockScenarioConfig = { ...DEFAULT_MOCK_SCENARIOS };

/** Restaura o cenário padrão (usado por testes e pelo painel de dev). */
export function resetMockScenarios(): void {
  Object.assign(mockScenarios, DEFAULT_MOCK_SCENARIOS);
}
