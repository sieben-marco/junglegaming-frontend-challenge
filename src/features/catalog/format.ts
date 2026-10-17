/**
 * Formatação de valores do catálogo.
 *
 * Regra do projeto: ETH trafega como STRING decimal (nunca `number`) para não
 * perder precisão. Aqui só cuidamos da APRESENTAÇÃO.
 */

/** Exibe ETH com 2 casas (ex.: "1.19"). */
export function formatEth(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toFixed(2);
}

/** Rótulo de preço pronto para a tela (ex.: "1.19 ETH"). */
export function formatEthLabel(value: string): string {
  return `${formatEth(value)} ETH`;
}
