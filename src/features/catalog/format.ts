/**
 * Formatação de valores do catálogo.
 *
 * O dinheiro (ETH) passou a viver em `@/lib/eth` (aritmética decimal com
 * BigInt, para não perder precisão). Reexportamos aqui para manter estáveis os
 * imports que já existiam no catálogo (`../format`).
 */
export { formatEth, formatEthLabel } from '@/lib/eth';
