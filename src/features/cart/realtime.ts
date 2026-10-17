import { multiplyEth } from '@/lib/eth';
import type { Cart, CartItem } from '@/types/cart';
import type { NftUpdateEvent } from '@/types/realtime';
import { withRecalculatedTotals } from './optimistic';

/**
 * Aplica um evento de TEMPO REAL (`nft.updated`) a um carrinho JÁ em cache.
 *
 * Por que mexer no carrinho no cliente? Porque o evento chega pelo socket
 * enquanto a tela está aberta: sem isto, a linha e o resumo só mudariam no
 * próximo refetch — e o aviso de "o preço mudou" chegaria atrasado.
 *
 * Por que é seguro prever o valor aqui? Porque a conta é feita com as MESMAS
 * funções puras do "servidor" (`multiplyEth` para o total da linha e
 * `withRecalculatedTotals` → `computeCartTotals` para o resumo). Nada de fórmula
 * paralela: o número exibido bate com o da API.
 *
 * O QUE NÃO MUDAMOS: `unitPriceWhenAddedEth` guarda o preço da inclusão — é
 * justamente ele que, ao divergir do preço atual, diz à UI "avise que o preço
 * foi atualizado" (`cart-item-row.tsx`).
 *
 * Devolve o MESMO objeto quando nenhuma linha é afetada, para não provocar
 * re-render em quem não tem esse NFT no carrinho.
 */
export function applyNftPriceToCart(cart: Cart, update: NftUpdateEvent): Cart {
  const affected = cart.items.some((item) => item.nftId === update.id);
  if (!affected) return cart;

  const items: CartItem[] = cart.items.map((item) =>
    item.nftId === update.id
      ? {
          ...item,
          unitPriceEth: update.priceEth,
          lineTotalEth: multiplyEth(update.priceEth, item.quantity),
        }
      : item,
  );

  return withRecalculatedTotals({ ...cart, items });
}
