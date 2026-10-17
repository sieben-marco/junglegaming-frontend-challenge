import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Worker do MSW no navegador. `setupWorker` recebe os handlers e passa a
 * interceptar as requisições de rede feitas pela aplicação.
 */
export const worker = setupWorker(...handlers);
