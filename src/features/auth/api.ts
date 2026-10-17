import { http } from '@/lib/http';
import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/auth-token';
import { getApiError } from '@/lib/api-error';
import type { LoginInput, LoginResponse, RegisterInput, SessionResponse, User } from '@/types/auth';

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
 * Cadastro de conta.
 *
 * O "servidor" já devolve o TOKEN junto (a pessoa entra ao criar a conta, sem
 * uma segunda ida ao login) — e faz o mesmo trabalho do login: cria a sessão e
 * mescla o carrinho do visitante.
 */
export async function register(input: RegisterInput): Promise<User> {
  const { data } = await http.post<LoginResponse>('/auth/register', input);
  setAuthToken(data.token);
  return data.user;
}

/**
 * Logout: avisa o servidor (encerra a sessão) e descarta o token local.
 *
 * Se a chamada falhar (rede caiu no meio), ainda assim esquecemos o token: do
 * ponto de vista do usuário, "sair" precisa sair — e a sessão no servidor tem
 * prazo de validade de qualquer forma.
 */
export async function logout(): Promise<void> {
  try {
    await http.post('/auth/logout');
  } finally {
    clearAuthToken();
  }
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
