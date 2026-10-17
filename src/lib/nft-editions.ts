import type { Nft, NftEdition } from '@/types/nft';

/**
 * Regras PURAS de edição de um NFT.
 *
 * Ficam em `lib/` porque DUAS telas precisam da mesma decisão: o detalhe (que
 * deixa o usuário escolher) e o card do catálogo (que usa a edição padrão com
 * quantidade 1). Compartilhar evita que cada tela invente a sua regra.
 */

/** Edição inicial: a primeira com estoque; se todas esgotaram, a primeira. */
export function pickDefaultEdition(nft: Nft): NftEdition {
  return nft.editions.find((edition) => edition.available > 0) ?? nft.editions[0];
}

/**
 * Maior quantidade comprável numa edição.
 *
 * O enunciado pede o MENOR entre o disponível e o teto por pedido daquela
 * edição; se der 0, a edição está esgotada.
 */
export function maxQuantityFor(edition: NftEdition): number {
  return Math.min(edition.available, edition.maxPerOrder);
}
