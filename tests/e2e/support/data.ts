/**
 * Apoio dos testes E2E: valores ESPERADOS derivados das MESMAS fixtures que o
 * MSW serve.
 *
 * Isso é o que torna o teste determinístico: em vez de "chutar" um preço, o
 * teste importa a fixture (RNG com semente fixa) e a MESMA função de formatação
 * usada pela tela. Se a fixture mudar, o teste acompanha.
 */
import { NETWORK_FEE_ETH } from '../../../src/lib/cart-totals';
import { addEth, formatEthLabel, multiplyEth, percentOfEth, subEth } from '../../../src/lib/eth';
import { findNftById } from '../../../src/mocks/fixtures/nfts';
import type { Nft } from '../../../src/types/nft';

/** Devolve a fixture pelo id, falhando alto se ela não existir. */
export function requireNft(id: string): Nft {
  const nft = findNftById(id);
  if (!nft) throw new Error(`Fixture não encontrada: ${id}`);
  return nft;
}

/** Texto de disponibilidade exibido no detalhe. */
export function availabilityLabel(nft: Nft): string {
  if (nft.available === 0) return 'Esgotado';
  return `${nft.available} ${nft.available === 1 ? 'unidade disponível' : 'unidades disponíveis'}`;
}

/** Total do carrinho segundo a MESMA regra do "servidor" (`lib/cart-totals`). */
export function expectedTotal(subtotalEth: string, discountPercent = 0): string {
  const discount = discountPercent > 0 ? percentOfEth(subtotalEth, discountPercent) : '0';
  return addEth(subEth(subtotalEth, discount), NETWORK_FEE_ETH);
}

/** Escolhe a primeira edição que aceita mais de 1 unidade (para testar quantidade). */
export function pickMultiUnitEdition(nft: Nft): Nft['editions'][number] {
  const edition = nft.editions.find((item) => item.available >= 2 && item.maxPerOrder >= 2);
  if (!edition) throw new Error(`O NFT ${nft.id} não tem edição com 2+ unidades disponíveis`);
  return edition;
}

export { formatEthLabel, multiplyEth, percentOfEth, NETWORK_FEE_ETH };
