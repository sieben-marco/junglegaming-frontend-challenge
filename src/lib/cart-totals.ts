import type { CartTotals } from '@/types/cart';
import { addEth, compareEth, percentOfEth, subEth } from './eth';

/**
 * Regras de TOTAIS do carrinho.
 *
 * Vive em `lib/` porque é DOMÍNIO PURO e é usado nos DOIS lados:
 *  - no handler do MSW (o "servidor", fonte da verdade);
 *  - na atualização OTIMISTA do cliente (para prever o próximo total).
 *
 * Compartilhar evita a clássica divergência "a UI calculou diferente do
 * backend" — as duas pontas usam a MESMA função.
 */

/** Taxa de rede estimada, por carrinho (valor do design). */
export const NETWORK_FEE_ETH = '0.016';

export interface CartTotalsInput {
  subtotalEth: string;
  /** Percentual de desconto do cupom (0 quando não há cupom). */
  discountPercent: number;
}

/**
 * Calcula subtotal/desconto/taxa/total.
 * Fórmula: `total = subtotal − desconto + taxa`.
 * Carrinho vazio não tem taxa de rede (nada a "ligar" na rede).
 */
export function computeCartTotals({ subtotalEth, discountPercent }: CartTotalsInput): CartTotals {
  const hasItems = compareEth(subtotalEth, '0') > 0;
  const networkFeeEth = hasItems ? NETWORK_FEE_ETH : '0';
  const discountEth = hasItems && discountPercent > 0 ? percentOfEth(subtotalEth, discountPercent) : '0';
  const totalEth = addEth(subEth(subtotalEth, discountEth), networkFeeEth);

  return { subtotalEth, discountEth, networkFeeEth, totalEth };
}
