/**
 * Liga/desliga a camada de mocks (MSW).
 *
 * Ativamos por CONFIGURAÇÃO (não só por ambiente) para que o build de
 * demonstração também rodem com mocks, como o desafio exige:
 *  - em desenvolvimento: sempre ligado (`import.meta.env.DEV`);
 *  - em preview/build de demo: quando `VITE_ENABLE_MOCKS="true"`.
 *
 * O import é dinâmico para o código de mocking não entrar no bundle de
 * produção real.
 */
export async function enableMocking(): Promise<void> {
  const isEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true';
  if (!isEnabled) return;

  // Em DEV, deixa os interruptores de cenário acessíveis pelo console
  // (`window.__kurioMocks`) — sem custo no bundle de produção.
  const { exposeMockDevTools } = await import('./dev-tools');
  exposeMockDevTools();

  const { worker } = await import('./browser');
  await worker.start({
    // Não reclamar de requisições que não têm handler (ex.: assets, HMR).
    onUnhandledRequest: 'bypass',
  });
}
