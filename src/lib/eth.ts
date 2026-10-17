/**
 * Aritmética e formatação de valores em ETH.
 *
 * REGRA DO PROJETO (enunciado §3): valores em ETH trafegam como STRING decimal e
 * precisam manter a precisão nos cálculos e na apresentação.
 *
 * Por que não usar `number`? Porque ponto flutuante erra somas "óbvias":
 *
 *   0.1 + 0.2 === 0.30000000000000004   // true! 😱
 *   1.19 * 9  === 10.709999999999999    // true! 😱
 *
 * Para DINHEIRO isso é inaceitável. A solução é a mesma do Ethereum: representar
 * o valor como INTEIRO numa escala fixa (em vez de "wei" com 18 casas, usamos 6
 * casas — suficiente para o desafio). Calculamos com `BigInt` (inteiro de
 * precisão arbitrária) e só convertemos para string "bonita" na exibição.
 *
 * Este módulo é DOMÍNIO PURO (sem React, sem HTTP): pode ser usado por
 * componentes, hooks e pelos handlers do MSW.
 */

/** Casas decimais usadas internamente (escala fixa). */
export const ETH_DECIMALS = 6;

const SCALE = 10n ** BigInt(ETH_DECIMALS);

const ETH_PATTERN = /^(-)?(\d+)(?:\.(\d+))?$/;

/**
 * Converte uma string decimal ("1.19") no inteiro da escala ("1190000").
 * Lança se o formato for inválido — erro de programação, não de usuário.
 */
export function ethToUnits(value: string): bigint {
  const match = ETH_PATTERN.exec(value.trim());
  if (!match) throw new Error(`Valor ETH inválido: "${value}"`);

  const [, sign, intPart = '0', fracPart = ''] = match;
  const frac = (fracPart + '0'.repeat(ETH_DECIMALS)).slice(0, ETH_DECIMALS);
  const units = BigInt(intPart) * SCALE + BigInt(frac);
  return sign ? -units : units;
}

/**
 * Converte o inteiro da escala de volta para string decimal ("1.19"),
 * removendo zeros à direita. `maxDecimals` limita o que é exibido.
 */
export function unitsToEth(units: bigint, maxDecimals: number = ETH_DECIMALS): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;

  const intPart = (abs / SCALE).toString();
  const frac = (abs % SCALE)
    .toString()
    .padStart(ETH_DECIMALS, '0')
    .slice(0, Math.max(0, Math.min(maxDecimals, ETH_DECIMALS)))
    .replace(/0+$/, '');

  const body = frac ? `${intPart}.${frac}` : intPart;
  return negative && body !== '0' ? `-${body}` : body;
}

/** Soma dois valores ETH (string + string ⇒ string). */
export function addEth(a: string, b: string): string {
  return unitsToEth(ethToUnits(a) + ethToUnits(b));
}

/** Subtrai dois valores ETH (nunca fica negativo "por acidente"). */
export function subEth(a: string, b: string): string {
  const result = ethToUnits(a) - ethToUnits(b);
  return unitsToEth(result < 0n ? 0n : result);
}

/** Multiplica um valor ETH por um inteiro (ex.: preço × quantidade). */
export function multiplyEth(value: string, times: number): string {
  return unitsToEth(ethToUnits(value) * BigInt(Math.trunc(times)));
}

/**
 * Calcula `percent`% de um valor ETH (ex.: `percentOfEth('100', 10)` ⇒ "10").
 * O `percent` pode ter 2 casas (ex.: 12.5).
 */
export function percentOfEth(value: string, percent: number): string {
  const basisPoints = BigInt(Math.round(percent * 100));
  return unitsToEth((ethToUnits(value) * basisPoints) / 10_000n);
}

/** Compara dois valores ETH: -1 (a<b), 0 (iguais), 1 (a>b). */
export function compareEth(a: string, b: string): number {
  const left = ethToUnits(a);
  const right = ethToUnits(b);
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/** Soma uma lista de valores ETH (lista vazia ⇒ "0"). */
export function sumEth(values: string[]): string {
  return unitsToEth(values.reduce((total, value) => total + ethToUnits(value), 0n));
}

/**
 * Formata um valor ETH para exibição, tolerante a valores inesperados:
 * remove zeros à direita e não quebra a tela se a string vier inválida.
 */
export function formatEth(value: string, maxDecimals: number = ETH_DECIMALS): string {
  try {
    return unitsToEth(ethToUnits(value), maxDecimals);
  } catch {
    return value;
  }
}

/** Rótulo pronto para a tela (ex.: "1.19 ETH"). */
export function formatEthLabel(value: string, maxDecimals: number = ETH_DECIMALS): string {
  return `${formatEth(value, maxDecimals)} ETH`;
}
