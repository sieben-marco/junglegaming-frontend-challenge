import type { Nft } from '@/types/nft';
import { getNftPatch } from './db';
import { NFTS, findNftById } from './fixtures/nfts';

/**
 * O CATÁLOGO COMO O SERVIDOR VÊ AGORA.
 *
 * Os fixtures (`NFTS`) são o ponto de partida determinístico; as mudanças de
 * tempo real vivem no "banco" (`db.ts`). Este módulo junta as duas coisas — e é
 * o ÚNICO lugar que sabe disso.
 *
 * Por que centralizar? Porque o enunciado exige que uma mudança simulada
 * apareça TANTO nas respostas REST QUANTO nos eventos. Se cada handler
 * aplicasse o patch por conta própria, um deles esqueceria e o REST passaria a
 * discordar do socket.
 *
 * REGRA: handlers REST do catálogo/carrinho leem os NFTs por aqui, nunca
 * diretamente de `NFTS`.
 */

/** Aplica a alteração vigente (se houver) sobre um NFT do fixture. */
function withPatch(nft: Nft): Nft {
  const patch = getNftPatch(nft.id);
  if (!patch) return nft;
  return { ...nft, priceEth: patch.priceEth };
}

/** Catálogo completo, com as alterações de tempo real aplicadas. */
export function listNfts(): Nft[] {
  return NFTS.map(withPatch);
}

/** Um NFT pelo id, com as alterações de tempo real aplicadas. */
export function findNft(nftId: string): Nft | undefined {
  const nft = findNftById(nftId);
  return nft ? withPatch(nft) : undefined;
}
