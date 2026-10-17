/**
 * Pequenas formatações de APRESENTAÇÃO usadas em várias telas.
 * Domínio puro (sem React): pode ser usado por componentes e testes.
 */

/** Encurta um endereço on-chain: "0x7A42…19E8". */
export function truncateAddress(address: string, left = 6, right = 4): string {
  if (address.length <= left + right + 1) return address;
  return `${address.slice(0, left)}…${address.slice(-right)}`;
}

/** Nota média com 1 casa (ex.: 4.8). */
export function formatRating(average: number): string {
  return average.toFixed(1);
}

/** Data curta em pt-BR (ex.: "30 set 2026"). */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

/** Junta uma lista em texto legível (ex.: "Óculos, Esmeralda, Raro"). */
export function formatList(items: string[]): string {
  return items.join(', ');
}
