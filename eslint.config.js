import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // `src/routeTree.gen.ts` é gerado pelo TanStack Router — não deve ser lintado.
  // `playwright-report`/`test-results` são artefatos dos testes E2E.
  globalIgnores([
    'dist',
    'src/routeTree.gen.ts',
    'public/mockServiceWorker.js',
    'playwright-report',
    'test-results',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Testes E2E e config do Playwright rodam no Node (e mexem no `window` da
    // página via `page.evaluate`), então precisam dos dois conjuntos de globais.
    files: ['playwright.config.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Arquivos de rota do TanStack exportam `Route` (um objeto) junto com o
    // componente, e os arquivos shadcn exportam variantes `cva`. Isso é o
    // padrão dessas libs e conflita com a regra de Fast Refresh.
    files: ['src/routes/**/*.{ts,tsx}', 'src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]);
