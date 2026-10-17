import { http, HttpResponse } from 'msw';
import { catalogHandlers } from './catalog';
import { cartHandlers } from './cart';
import { favoritesHandlers } from './favorites';
import { realtimeHandlers } from '../realtime';

/**
 * Todos os handlers do MSW: REST + TEMPO REAL.
 *
 * Cada domínio (catálogo, carrinho, favoritos, sessão, pedidos...) vive em seu
 * próprio arquivo e é combinado aqui. `src/mocks/browser.ts` monta o worker com
 * esta lista.
 */
export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...catalogHandlers,
  ...cartHandlers,
  ...favoritesHandlers,
  ...realtimeHandlers,
];
