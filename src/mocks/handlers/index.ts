import { http, HttpResponse } from 'msw';
import { catalogHandlers } from './catalog';

/**
 * Todos os handlers REST do MSW.
 *
 * Cada domínio (catálogo, sessão, carrinho, pedidos...) vive em seu próprio
 * arquivo e é combinado aqui. `src/mocks/browser.ts` monta o worker com esta
 * lista.
 */
export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...catalogHandlers,
];
