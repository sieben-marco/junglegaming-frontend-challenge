import { io, type Socket } from 'socket.io-client';

/**
 * URL do servidor Socket.IO. Em dev/preview usamos a mesma origem, pois o
 * MSW intercepta o WebSocket e simula os eventos do servidor.
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;

/**
 * Cria uma conexão Socket.IO (tempo real).
 *
 * NOTA IMPORTANTE: forçamos `transports: ['websocket']`.
 * O Socket.IO, por padrão, começa com "polling" (HTTP) e só depois tenta
 * subir para WebSocket. O MSW só intercepta o WebSocket, então sem forçar
 * esse transporte os mocks de tempo real não funcionariam.
 *
 * `autoConnect: false`: quem conecta é o chamador, dando controle do ciclo
 * de vida (abrir/fechar junto com os componentes que precisam).
 */
export function createSocket(url: string = SOCKET_URL): Socket {
  return io(url, {
    transports: ['websocket'],
    autoConnect: false,
  });
}
