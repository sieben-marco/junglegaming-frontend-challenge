import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração dos testes E2E (Playwright).
 *
 * Estratégia: o Playwright sobe o PRÓPRIO dev server numa porta dedicada
 * (`5199`) com `--strictPort`. Assim o teste não depende de um servidor que já
 * esteja rodando na 5173 e falha de forma clara se a porta estiver ocupada —
 * nada de "passou no meu terminal".
 *
 * Os mocks (MSW) ligam automaticamente em DEV, então o app fala com o
 * "servidor" simulado como falaria com um backend real.
 */
const PORT = 5199;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  // Cada teste é independente (contexto novo ⇒ localStorage/db limpos).
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: 'test-results',
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    // Diagnóstico: em falha (ou retry) guardamos trace/screenshot/vídeo,
    // como o enunciado pede ("traces" + relatório HTML).
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'desktop-chromium',
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      // Os fluxos do rodapé fixo têm layout próprio: rodam com viewport de celular.
      name: 'mobile-chromium',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    // Devtools flutuantes cobrem a barra de compra no mobile e atrapalhariam
    // cliques reais; nos testes eles ficam desligados.
    env: { VITE_DISABLE_DEVTOOLS: 'true' },
  },
});
