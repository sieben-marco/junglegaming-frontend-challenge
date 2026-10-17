/**
 * Token da sessão no lado do CLIENTE.
 *
 * O servidor devolve um token no login; guardá-lo aqui (e reenviá-lo em cada
 * requisição) é o que mantém a sessão viva entre navegações e refreshes.
 * Como tudo é simulado no navegador, o "armazenamento" é o `localStorage` —
 * o enunciado permite persistência local para sustentar o refresh.
 *
 * POR QUE UM MÓDULO SÓ PARA ISTO:
 *  - o Axios lê o token para montar o cabeçalho (ver `lib/http.ts`);
 *  - o React precisa SABER quando o token muda (login, logout ou um 401 que o
 *    servidor devolveu) para reavaliar a sessão. Em vez de espalhar
 *    `localStorage` pelo app, quem escreve avisa os "ouvintes" daqui.
 */
const AUTH_TOKEN_STORAGE_KEY = 'kurio:auth-token';

type AuthTokenListener = () => void;

const listeners = new Set<AuthTokenListener>();

function hasLocalStorage(): boolean {
  try {
    return typeof globalThis.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/** Token atual (ou `null` para visitante). */
export function getAuthToken(): string | null {
  if (!hasLocalStorage()) return null;
  try {
    return globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Modo privado/bloqueado: seguimos como visitante em vez de quebrar.
    return null;
  }
}

/** Guarda o token do login e avisa quem depende da sessão. */
export function setAuthToken(token: string): void {
  if (hasLocalStorage()) {
    try {
      globalThis.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } catch {
      // Ignora: sem storage a sessão vale só até o próximo refresh.
    }
  }
  notifyAuthTokenChange();
}

/** Descarta o token (logout ou sessão recusada pelo servidor). */
export function clearAuthToken(): void {
  if (hasLocalStorage()) {
    try {
      globalThis.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      // Ignora.
    }
  }
  notifyAuthTokenChange();
}

/**
 * Assina as mudanças do token — devolve a função para CANCELAR a assinatura
 * (formato exigido pelo `useSyncExternalStore`, do React).
 */
export function subscribeToAuthToken(listener: AuthTokenListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyAuthTokenChange(): void {
  for (const listener of listeners) listener();
}
