import { expect, type Page } from '@playwright/test';
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
