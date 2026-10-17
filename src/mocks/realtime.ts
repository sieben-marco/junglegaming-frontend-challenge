import { toSocketIo } from '@mswjs/socket.io-binding';
import { ws } from 'msw';
import type { NftUpdateEvent } from '@/types/realtime';
import { patchNftPrice } from './db';

/**
 * TEMPO REAL do "servidor" simulado (Socket.IO).
 *
 * Como funciona: o MSW intercepta o WebSocket e o `@mswjs/socket.io-binding`
 * traduz o protocolo binário do Socket.IO (engine.io + socket.io-parser) de/para
 * eventos JS. Assim o app usa `socket.io-client` DE VERDADE — nada de substituir
 * o socket por callbacks ou mexer no cache direto (o que seria eliminatório).
 *
 * LIMITAÇÃO DO TRANSPORTE (documentada): o MSW só consegue interceptar o
 * WebSocket, então o client precisa subir direto em `transports: ['websocket']`
 * (o padrão do Socket.IO começa com "polling" HTTP). Isso está em
 * `src/lib/socket.ts`.
 *
 * LIMITAÇÃO DO BINDING: ele não implementa salas/namespaces/broadcast do
 * Socket.IO; para "transmitir", guardamos as conexões e escrevemos em cada uma.
 */

/**
 * O MSW intercepta TODO WebSocket da página; este padrão casa o handshake do
 * Socket.IO, que vive na RAIZ da origem (`/socket.io/?EIO=4&transport=websocket`).
 *
 * Dois detalhes do MSW que explicam o padrão:
 *  1. ao casar a URL, o MSW remove a query e o caminho `/socket.io/` do
 *     handshake — a URL comparada vira `http://<origem>/`. Por isso o padrão é
 *     uma string relativa (`'/'`), resolvida contra a origem da página;
 *  2. por isso, um WebSocket da própria origem (ex.: o HMR do Vite) também
 *     casaria aqui — então, dentro do handler, deixamos passar quem NÃO é
 *     Socket.IO.
 *
 * NOTA: não use RegExp aqui — o `path-to-regexp` (usado pelo MSW para casar
 * URLs) não aceita RegExp nesta versão.
 */
const SOCKET_HANDSHAKE_PATH = '/';

/** O que o "servidor" guarda de cada conexão, para poder transmitir. */
interface RealtimeClient {
  /** A conexão ainda está aberta? (o WebSocket guarda `readyState`). */
  isOpen: () => boolean;
  emit: (event: string, ...data: unknown[]) => void;
  /** Fecha a conexão (usado para simular QUEDA no cenário de reconciliação). */
  close: () => void;
}

/** Conexões do app (o "servidor" usa esta lista para transmitir). */
const clients = new Set<RealtimeClient>();

/** `readyState` 1 = OPEN (constantes do próprio WebSocket). */
const SOCKET_OPEN = 1;

export const realtimeHandlers = [
  // O MSW entrega a conexão WebSocket crua; o binding cuida do protocolo.
  ws.link(SOCKET_HANDSHAKE_PATH).addEventListener('connection', (connection) => {
    // Não é Socket.IO (ex.: o WebSocket do HMR do Vite)? Então conecta no
    // servidor de verdade e sai — os mocks não devem "engolir" outros sockets.
    if (!connection.client.url.href.includes('/socket.io/')) {
      connection.server.connect();
      return;
    }

    const io = toSocketIo(connection);
    /**
     * O `socket` cru existe na implementação do MSW
     * (`WebSocketClientConnection.socket`), mas não no protocolo público. É dele
     * que lemos `readyState`, para saber se a conexão continua viva.
     */
    const rawSocket = (connection.client as unknown as { socket: WebSocket }).socket;

    const client: RealtimeClient = {
      isOpen: () => rawSocket.readyState === SOCKET_OPEN,
      emit: (event, ...data) => {
        try {
          io.client.emit(event, ...data);
        } catch {
          // Conexão caiu no meio do caminho: basta parar de usá-la.
          clients.delete(client);
        }
      },
      close: () => connection.client.close(),
    };

    clients.add(client);
    // O binding já envia o handshake (engine.io "open" + socket.io "connect").
    connection.client.addEventListener('close', () => clients.delete(client));
  }),
];

/** Envia um evento para todos os clientes AINDA conectados. */
export function broadcast(event: string, payload: unknown): void {
  for (const client of [...clients]) {
    // Conexão morta (ex.: a montagem dupla do StrictMode em DEV): descarta.
    if (!client.isOpen()) {
      clients.delete(client);
      continue;
    }
    client.emit(event, payload);
  }
}

/**
 * Quantas conexões estão abertas agora.
 *
 * Serve para as ferramentas de dev (e para os testes) esperarem o socket
 * CONECTAR antes de disparar um evento — sem isso o teste dependeria de "dormir
 * um pouco e torcer".
 */
export function connectedClientCount(): number {
  return [...clients].filter((client) => client.isOpen()).length;
}

/**
 * Ação do "servidor": muda o preço de um NFT e AVISA quem está conectado.
 *
 * Faz as duas coisas de propósito: o REST (que lê o banco) e o evento precisam
 * contar a MESMA história — senão um F5 mostraria um preço e a tela outro.
 */
export function changeNftPrice(input: { id: string; priceEth: string }): NftUpdateEvent {
  const patch = patchNftPrice(input.id, input.priceEth);

  const event: NftUpdateEvent = {
    resource: 'nft',
    id: input.id,
    version: patch.version,
    priceEth: patch.priceEth,
    updatedAt: new Date().toISOString(),
  };

  broadcast('nft.updated', event);
  return event;
}

/** Reenvia um evento JÁ GERADO (usado para testar duplicata/evento antigo). */
export function emitNftUpdate(event: NftUpdateEvent): void {
  broadcast('nft.updated', event);
}

/**
 * Derruba TODAS as conexões abertas — simula QUEDA de rede do lado do servidor.
 *
 * Serve para exercitar a RECONCILIAÇÃO: com o app fora do ar, o servidor pode
 * mudar (e emitir) o que quiser, porque ninguém está escutando. Quando o socket
 * reconecta, o REST precisa contar a história que o cliente perdeu.
 *
 * Devolve quantas conexões foram fechadas (útil para o teste confirmar que havia
 * alguém conectado antes de derrubar).
 */
export function disconnectClients(): number {
  const closed = [...clients];
  for (const client of closed) client.close();
  clients.clear();
  return closed.length;
}
