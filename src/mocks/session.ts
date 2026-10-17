import { findSession, removeSession } from './db';

/**
 * Estado de SESSÃO simulado (usado pelos handlers do MSW).
 *
 * Como isso funciona: no login o "servidor" cria uma sessão e devolve um TOKEN
 * (ver `db.createSession`). O cliente guarda esse token e o reenvia em todas as
 * requisições (`Authorization: Bearer <token>` — ver `lib/http.ts`). Aqui
 * traduzimos esse cabeçalho para "quem é o usuário desta requisição".
 *
 * É por isso que os handlers privados (favoritos, e depois pedidos/perfil)
 * recebem o `request`: a identidade vem da REQUISIÇÃO, não de uma variável
 * global — exatamente como num servidor de verdade (e é o que garante o
 * ISOLAMENTO dos dados por usuário).
 */

/** Escopo do carrinho de visitante (quando não há usuário logado). */
export const GUEST_SCOPE = 'guest';

/** Lê o token de `Authorization: Bearer <token>` (ou `null` se não houver). */
export function readBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim() || null;
}

/**
 * Id do usuário da sessão desta requisição.
 *
 * `null` quando: não veio token; o token é desconhecido (logout em outro
 * dispositivo); ou a sessão EXPIROU (aí ela é descartada na hora).
 */
export function getCurrentUserId(request: Request): string | null {
  const token = readBearerToken(request);
  if (!token) return null;

  const session = findSession(token);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    removeSession(token);
    return null;
  }

  return session.userId;
}

/**
 * Escopo do carrinho desta requisição: o do usuário logado ou o do visitante.
 *
 * Isto é o que faz o carrinho "trocar de dono" ao entrar — e o do visitante ser
 * mesclado no do usuário (ver `handlers/auth.ts`).
 */
export function getCartScope(request: Request): string {
  return getCurrentUserId(request) ?? GUEST_SCOPE;
}
