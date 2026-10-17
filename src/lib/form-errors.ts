/**
 * Conversão de problemas de validação (zod) para mensagens por campo.
 *
 * O zod devolve uma LISTA de problemas, cada um com o `path` do campo (ex.:
 * `['email']`) e uma mensagem. A interface quer um mapa simples
 * (`{ email: 'Informe um e-mail válido.' }`), porque cada campo mostra UMA
 * mensagem. Quando há vários problemas no mesmo campo, fica o primeiro — que é
 * a mensagem mais específica da validação.
 *
 * Usamos `error.issues` (a estrutura estável do zod) em vez de helpers como
 * `flatten()` para não depender de detalhes de versão.
 */
export function toFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of issues) {
    const field = String(issue.path[0] ?? '');
    if (field && !(field in errors)) errors[field] = issue.message;
  }

  return errors;
}
