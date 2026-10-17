import { expect, type Page, type Request } from '@playwright/test';
import type { NftUpdateEvent } from '../../../src/types/realtime';

/**
 * Apoio para os testes de TEMPO REAL.
 *
 * Quem "mexe no mundo" é o servidor simulado (que vive na mesma página, exposto
 * como `window.__kurioMocks` em DEV). O teste NUNCA escreve no cache nem chama
 * setter da UI: ele dispara a ação do servidor e deixa o evento viajar pelo
 * Socket.IO de verdade até o `socket.io-client` do app.
 */
interface KurioRealtimeTools {
  changeNftPrice: (input: { id: string; priceEth: string }) => NftUpdateEvent;
  emitNftUpdate: (event: NftUpdateEvent) => void;
  connectedClientCount: () => number;
}

/** Espera o socket do app CONECTAR (sem `waitForTimeout`: observa o servidor). */
export async function waitForRealtimeConnection(page: Page): Promise<void> {
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const tools = (window as unknown as { __kurioMocks?: KurioRealtimeTools }).__kurioMocks;
        return tools?.connectedClientCount() ?? -1;
      }),
    )
    .toBe(1);
}

/** Ação do servidor: muda o preço e emite `nft.updated`. Devolve o evento gerado. */
export async function serverChangesNftPrice(
  page: Page,
  input: { id: string; priceEth: string },
): Promise<NftUpdateEvent> {
  return page.evaluate((payload) => {
    const tools = (window as unknown as { __kurioMocks?: KurioRealtimeTools }).__kurioMocks;
    if (!tools) throw new Error('window.__kurioMocks não está disponível (mocks desligados?)');
    return tools.changeNftPrice(payload);
  }, input);
}

/**
 * Reentrega um evento JÁ GERADO (duplicata ou fora de ordem).
 *
 * É o cenário que o enunciado exige: o cliente precisa tolerar eventos
 * repetidos e antigos sem regredir um estado mais recente.
 */
export async function serverReplaysNftUpdate(page: Page, event: NftUpdateEvent): Promise<void> {
  await page.evaluate((payload) => {
    const tools = (window as unknown as { __kurioMocks?: KurioRealtimeTools }).__kurioMocks;
    if (!tools) throw new Error('window.__kurioMocks não está disponível (mocks desligados?)');
    tools.emitNftUpdate(payload);
  }, event);
}

/**
 * Espera o carrinho "sossegar": nenhuma busca de `GET /api/cart` em voo.
 *
 * POR QUE ISTO EXISTE (teste que "morde"): ao adicionar algo, o carrinho é
 * INVALIDADO e uma nova busca dispara. Se a resposta dessa busca chegasse DEPOIS
 * do evento de preço, ela já viria com o preço NOVO (o "servidor" muda o banco
 * antes de responder) e o teste passaria SEM exercitar a atualização que o
 * evento faz no cliente — teste que passa por acaso esconde bug (AGENTS.md §9).
 * Só com o carrinho quieto o evento pode ser disparado com honestidade.
 *
 * O contador acompanha as buscas EM VOO (enviadas − respondidas/falhadas) e
 * exige uma janela curta de estabilidade, para não confundir "ainda não começou"
 * com "já terminou".
 */
export async function waitForCartFetchToSettle(page: Page): Promise<void> {
  const isCartFetch = (request: Request): boolean =>
    request.method() === 'GET' && new URL(request.url()).pathname === '/api/cart';

  let inFlight = 0;
  let idleSince: number | null = null;

  page.on('request', (request) => {
    if (isCartFetch(request)) {
      inFlight += 1;
      idleSince = null;
    }
  });
  page.on('response', (response) => {
    if (isCartFetch(response.request())) inFlight = Math.max(0, inFlight - 1);
  });
  page.on('requestfailed', (request) => {
    if (isCartFetch(request)) inFlight = Math.max(0, inFlight - 1);
  });

  /** 300 ms sem nenhuma busca em voo = o carrinho está parado. */
  await expect
    .poll(() => {
      if (inFlight > 0) return false;
      idleSince ??= Date.now();
      return Date.now() - idleSince >= 300;
    })
    .toBe(true);
}
