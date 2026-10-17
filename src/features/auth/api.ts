import { http } from '@/lib/http';
import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/auth-token';
import { getApiError } from '@/lib/api-error';
import type { LoginInput, LoginResponse, SessionResponse, User } from '@/types/auth';

/**
 * Acesso à API de conta/sessão.
 *
 * Repare no fluxo do token: o `login` guarda o token ANTES de devolver o
 * usuário. Assim, qualquer requisição disparada logo depois (o carrinho, os
 * favoritos) já sai autenticada — não existe janela em que a tela sabe quem é o
 * usuário mas a API ainda não.
 */

export async function login(input: LoginInput): Promise<User> {
  const { data } = await http.post<LoginResponse>('/auth/login', input);
  setAuthToken(data.token);
  return data.user;
}

/**
 * Sessão atual (`GET /api/auth/session`) — usada ao abrir o app para RECUPERAR
 * a sessão depois de um refresh.
 *
 * Sem token não há o que perguntar: devolvemos `null` sem tocar a rede (um
 * visitante não deveria gerar 401 a cada carregamento de página).
 * Se o servidor RECUSAR o token (expirou), limpamos e voltamos a ser visitante:
 * é o caminho da "expiração durante a navegação".
 */
export async function fetchSession(): Promise<User | null> {
  if (!getAuthToken()) return null;

  try {
    const { data } = await http.get<SessionResponse>('/auth/session');
    return data.user;
  } catch (error) {
    if (getApiError(error).status === 401) {
      clearAuthToken();
      return null;
    }
    throw error;
  }
}
