/**
 * Contratos dos eventos de TEMPO REAL (Socket.IO).
 *
 * O enunciado pede que os eventos carreguem:
 *  - IDENTIDADE ESTÁVEL do recurso (`id`);
 *  - o RECURSO afetado (`resource`);
 *  - e uma VERSÃO (`version`), para o cliente tolerar duplicatas e eventos
 *    antigos sem regredir um estado mais recente.
 *
 * A versão é MONOTÔNICA POR RECURSO (quem gera é o "servidor", no MSW).
 */

/** Evento `nft.updated`: preço (e, no futuro, disponibilidade) mudou. */
export interface NftUpdateEvent {
  resource: 'nft';
  /** Identidade estável do NFT (ex.: `nft-001`). */
  id: string;
  /** Versão do recurso: sempre crescente. Versão menor/igual já foi aplicada. */
  version: number;
  /** Preço atualizado, em ETH (string decimal, como no REST). */
  priceEth: string;
  /** ISO 8601 do momento da mudança (exibição/auditoria). */
  updatedAt: string;
}
