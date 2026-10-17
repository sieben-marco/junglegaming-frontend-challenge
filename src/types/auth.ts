/**
 * Contratos de SESSÃO (conta do colecionador) do Kurio.
 *
 * Este é o "idioma" combinado entre transporte (Axios/MSW), estado (TanStack
 * Query) e interface. A senha NUNCA aparece aqui: ela sobe uma vez no login e o
 * servidor devolve um `User` SEM credenciais.
 */

/**
 * Usuário autenticado — o que a API devolve.
 *
 * De propósito NÃO tem senha nem hash: o "servidor" nunca devolve credencial
 * (ver `mock/fixtures/users.ts`).
 */
export interface User {
  id: string;
  /** Nome de exibição ("Ana Souza"). */
  displayName: string;
  /** Nome de usuário público ("anasouza"), usado no perfil. */
  username: string;
  email: string;
  avatarUrl?: string;
}

/** Corpo de `POST /api/auth/login`. */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Corpo de `POST /api/auth/register`.
 *
 * O Figma pede só o "Nome de usuário" (não um nome de exibição separado), então
 * é ele que vira `username` — e o "servidor" usa o mesmo texto como
 * `displayName` (ver `handlers/auth.ts`).
 */
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

/**
 * Resposta do login: o usuário + o TOKEN da sessão.
 *
 * O token é o que o cliente guarda e reenvia em `Authorization: Bearer <token>`
 * nas próximas requisições — é assim que o "servidor" sabe quem está falando.
 */
export interface LoginResponse {
  user: User;
  token: string;
}

/** Resposta de `GET /api/auth/session` (quem está logado AGORA). */
export interface SessionResponse {
  user: User;
}
