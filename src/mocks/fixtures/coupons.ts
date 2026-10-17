/**
 * Cupons conhecidos pelo "servidor" simulado.
 *
 * O enunciado exige tratar código INVÁLIDO e EXPIRADO. Cupom expirado tem
 * `expiresAt` no passado; a comparação é feita pelo handler (fonte da verdade).
 */
export interface CouponFixture {
  code: string;
  /** Rótulo exibido no resumo do carrinho. */
  label: string;
  /** Percentual de desconto (0 a 100). */
  percent: number;
  /** ISO 8601 do fim da validade, ou `null` para "sem validade". */
  expiresAt: string | null;
}

export const COUPONS: CouponFixture[] = [
  { code: 'KURIO10', label: 'Desconto do lançamento', percent: 10, expiresAt: null },
  { code: 'KURIO25', label: 'Semana do colecionador', percent: 25, expiresAt: null },
  { code: 'EXPIRADO10', label: 'Promoção encerrada', percent: 10, expiresAt: '2026-01-01T00:00:00.000Z' },
];

/** Busca um cupom pelo código (case-insensitive). */
export function findCoupon(code: string): CouponFixture | undefined {
  const normalized = code.trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === normalized);
}
