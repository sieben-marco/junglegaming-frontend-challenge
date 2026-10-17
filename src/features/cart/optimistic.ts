import { computeCartTotals } from '@/lib/cart-totals';
import { multiplyEth, sumEth } from '@/lib/eth';
import type { Cart, CartItem } from '@/types/cart';
import type { NftEditionId } from '@/types/nft';

/**
 * Transformações OTIMISTAS do carrinho.
 *
 * Atualização otimista = assumir que a mutation vai dar certo e mostrar o novo
 * estado ANTES da resposta. Se falhar, o hook faz ROLLBACK com o snapshot
 * anterior. Para o "estado previsto" ser igual ao do servidor, reusamos a MESMA
 * regra de totais (`computeCartTotals`) — nada de duplicar fórmulas.
 *
 * Todas as funções são PURAS: recebem o carrinho atual, devolvem um novo.
 */

/** Dados mínimos para prever a inclusão de uma linha. */
export interface OptimisticCartItem {
  nftId: string;
  name: string;
  number: string;
  tokenId: string;
  imageUrl?: string;
  editionId: NftEditionId;
  editionLabel: string;
  unitPriceEth: string;
  available: number;
  maxPerOrder: number;
}

/** Recalcula os totais a partir das linhas (mesma fórmula do servidor). */
export function withRecalculatedTotals(cart: Cart): Cart {
  const subtotalEth = sumEth(cart.items.map((item) => item.lineTotalEth));
  return {
    ...cart,
    totals: computeCartTotals({ subtotalEth, discountPercent: cart.coupon?.percent ?? 0 }),
  };
}

/** Muda a quantidade de uma linha. */
export function applyQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  const items = cart.items.map((item) =>
    item.id === itemId
      ? { ...item, quantity, lineTotalEth: multiplyEth(item.unitPriceEth, quantity) }
      : item,
  );
  return withRecalculatedTotals({ ...cart, items });
}

/** Remove uma linha. */
export function applyRemove(cart: Cart, itemId: string): Cart {
  return withRecalculatedTotals({ ...cart, items: cart.items.filter((item) => item.id !== itemId) });
}

/** Inclui (ou soma quantidade em) uma linha. */
export function applyAdd(cart: Cart, item: OptimisticCartItem, quantity: number): Cart {
  const id = `${item.nftId}:${item.editionId}`;
  const existing = cart.items.find((line) => line.id === id);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  const items: CartItem[] = existing
    ? cart.items.map((line) =>
        line.id === id
          ? { ...line, quantity: nextQuantity, lineTotalEth: multiplyEth(line.unitPriceEth, nextQuantity) }
          : line,
      )
    : [
        ...cart.items,
        {
          ...item,
          id,
          quantity: nextQuantity,
          unitPriceWhenAddedEth: item.unitPriceEth,
          lineTotalEth: multiplyEth(item.unitPriceEth, nextQuantity),
        },
      ];

  return withRecalculatedTotals({ ...cart, items });
}

/** Aplica/remove cupom (prevê o desconto). */
export function applyCouponPatch(cart: Cart, coupon: Cart['coupon']): Cart {
  return withRecalculatedTotals({ ...cart, coupon });
}
