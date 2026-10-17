/**
 * Estado de SESSÃO simulado (usado pelos handlers do MSW).
 *
 * Ainda NÃO existe login: `getCurrentUserId()` devolve `null` e a API trata as
 * rotas privadas (favoritos) como não autorizadas (401). Quando a etapa de
 * sessão chegar, é AQUI que o usuário autenticado passa a ser resolvido — sem
 * tocar nos handlers.
 */

/** Escopo do carrinho de visitante (quando não há usuário logado). */
export const GUEST_SCOPE = 'guest';

/** Id do usuário da sessão atual — `null` enquanto não há login. */
export function getCurrentUserId(): string | null {
  return null;
}

/**
 * Escopo do carrinho. Hoje é sempre o do visitante; após o login passa a ser o
 * do usuário (e aí o carrinho do visitante é mesclado — requisito do enunciado).
 */
export function getCartScope(): string {
  return getCurrentUserId() ?? GUEST_SCOPE;
}
