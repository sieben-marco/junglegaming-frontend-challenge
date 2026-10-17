import type { User } from '@/types/auth';

/**
 * Contas FICTÍCIAS do "servidor" simulado.
 *
 * Duas exigências do enunciado estão resolvidas aqui:
 *  1. "Use credenciais fictícias" ⇒ as contas de demonstração abaixo.
 *  2. "não armazene senhas em claro" ⇒ guardamos só um DIGEST da senha.
 *
 * O digest é deliberadamente simples (FNV-1a, ~10 linhas): NÃO é criptografia de
 * verdade e não precisa ser — não existe segurança real num mock que roda no
 * navegador. O objetivo é não deixar a senha legível no `localStorage`/fixtures:
 * quem inspecionar o "banco" não descobre a senha em texto puro.
 */
export interface UserRecord extends User {
  /** Digest da senha (nunca a senha). */
  passwordHash: string;
}

/** Digest determinístico de uma senha (ver a explicação acima). */
export function hashPassword(password: string): string {
  let hash = 2166136261;
  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16)}`;
}

/**
 * Remove o que o cliente NÃO deve ver.
 *
 * É a fronteira do "servidor": por mais que o registro tenha o hash, a resposta
 * da API é montada por aqui — o hash nunca sai.
 */
export function toPublicUser(user: UserRecord): User {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
  };
}

/** Conta de demonstração — documentada no README e usada pelos testes E2E. */
export const DEMO_CREDENTIALS = { email: 'ana@kurio.art', password: 'kurio123' } as const;

/** Contas que "já existem" no servidor quando o app abre. */
export const USER_FIXTURES: UserRecord[] = [
  {
    id: 'user-001',
    displayName: 'Ana Souza',
    username: 'anasouza',
    email: DEMO_CREDENTIALS.email,
    passwordHash: hashPassword(DEMO_CREDENTIALS.password),
  },
  {
    id: 'user-002',
    displayName: 'Bruno Lima',
    username: 'brunolima',
    email: 'bruno@kurio.art',
    passwordHash: hashPassword(DEMO_CREDENTIALS.password),
  },
];
