import type { Socket } from 'socket.io-client';

/**
 * URL do servidor Socket.IO. Em dev/preview usamos a mesma origem, pois o
 * MSW intercepta o WebSocket e simula os eventos do servidor.
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;

/**
 * Cria uma conexão Socket.IO (tempo real).
 *
 * NOTA IMPORTANTE (transporte): forçamos `transports: ['websocket']`.
 * O Socket.IO, por padrão, começa com "polling" (HTTP) e só depois tenta subir
 * para WebSocket; o MSW só intercepta o WebSocket. Sem forçar esse transporte,
 * os mocks de tempo real não funcionariam.
 *
 * `autoConnect: false`: quem conecta é o chamador, dando controle do ciclo de
 * vida (abrir/fechar junto com os componentes que precisam).
 *
 * NOTA IMPORTANTE (import dinâmico): o `socket.io-client` é carregado AQUI,
 * dentro da função, e não no topo do arquivo. Motivo concreto: o
 * `engine.io-client` guarda `globalThis.WebSocket` numa constante no momento em
 * que o módulo é avaliado. Se ele fosse importado estaticamente, o módulo do
 * app carregaria ANTES de o MSW trocar `WebSocket` pelo interceptador — e o
 * mock de tempo real nunca veria a conexão. Importando sob demanda (depois que
 * `enableMocking()` rodou), o client enxerga o WebSocket interceptado.
 *
 * Por isso a função é `async`: quem chama precisa esperar.
 */
export async function createSocket(url: string = SOCKET_URL): Promise<Socket> {
  const { io } = await import('socket.io-client');

  return io(url, {
    transports: ['websocket'],
    autoConnect: false,
  });
}
