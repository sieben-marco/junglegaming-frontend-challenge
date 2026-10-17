import { getAuthToken, subscribeToAuthToken } from '@/lib/auth-token';
import { cartKeys } from '@/features/cart/queries';
import { favoritesKeys } from '@/features/favorites/queries';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { RegisterInput, User } from '@/types/auth';
import { fetchSession, login, logout, register } from './api';

/**
 * Sessão do usuário via TanStack Query.
 *
 * A sessão é um recurso do "servidor" (quem está logado, e até quando) — mas o
 * CLIENTE também tem estado próprio: o token. Os dois vivem juntos aqui:
 *  - o token diz "temos como nos identificar" (`useAuthToken`);
 *  - a consulta `auth/session` diz "o servidor reconhece esse token"
 *    (`useSession`).
 */

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: authKeys.session(),
    queryFn: fetchSession,
    // A sessão muda raramente; 5 min evitam reperguntar a cada navegação. Quem
    // invalida é a mudança de token (abaixo) ou um 401 vindo da API.
    staleTime: 5 * 60_000,
    // 401 não é erro "de rede": insistir não resolveria nada.
    retry: false,
  });
}

/**
 * Token da sessão, de forma REATIVA.
 *
 * `useSyncExternalStore` é o hook do React para ler estado que vive FORA do
 * React (aqui, o `localStorage` + os ouvintes de `lib/auth-token.ts`). Ele
 * garante que o componente reapareça com o valor novo quando o token muda —
 * inclusive quando quem o limpou foi o interceptor do Axios (após um 401).
 */
export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribeToAuthToken, getAuthToken, () => null);
}

/** Sessão do "servidor" (`{ data }` é o usuário, ou `null` para visitante). */
export function useSession() {
  const queryClient = useQueryClient();
  const token = useAuthToken();
  const previousToken = useRef(token);

  // Quando o token MUDA (login, logout, 401), a resposta em cache pode ser de
  // OUTRO estado: invalidamos para o servidor responder de novo. A checagem com
  // o valor anterior evita um refetch inútil na primeira renderização.
  useEffect(() => {
    if (previousToken.current === token) return;
    previousToken.current = token;
    void queryClient.invalidateQueries({ queryKey: authKeys.session() });
  }, [token, queryClient]);

  return useQuery(sessionQueryOptions());
}

/**
 * Usuário logado (ou `null` para visitante).
 *
 * Exige o TOKEN, não só o cache: logo depois de um 401 o cache ainda tem o
 * usuário antigo, mas a sessão já acabou — e a interface precisa agir como
 * visitante (senão a tela de login "devolveria" o usuário para dentro).
 */
export function useCurrentUser(): User | null {
  const token = useAuthToken();
  const { data } = useSession();
  return token && data ? data : null;
}

/**
 * Mantém a SESSÃO viva no app inteiro (chamado uma vez no layout raiz).
 *
 * É o que garante a "recuperação da sessão após refresh": ao abrir o app — em
 * QUALQUER tela — o cliente pergunta ao servidor quem é o usuário do token
 * guardado. Sem esta chamada global, a recuperação só aconteceria nas telas que
 * por acaso lessem a sessão, e o resto do app ficaria "sem saber" quem entrou.
 */
export function useSessionBootstrap(): User | null {
  return useCurrentUser();
}

/**
 * Entrar (login/cadastro) deu certo: guarda quem entrou e revalida o que depende
 * de QUEM está logado.
 *
 * O "servidor" acabou de:
 *  - MESCLAR o carrinho do visitante no do usuário (as linhas mudam de dono);
 *  - dar acesso aos favoritos, que agora existem de verdade.
 * Por isso as duas chaves são invalidadas: os dados em cache eram do VISITANTE.
 */
function applyAuthenticatedUser(queryClient: QueryClient, user: User): void {
  queryClient.setQueryData<User | null>(authKeys.session(), user);
  void queryClient.invalidateQueries({ queryKey: cartKeys.all });
  void queryClient.invalidateQueries({ queryKey: favoritesKeys.all });
}

/**
 * Login.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => applyAuthenticatedUser(queryClient, user),
  });
}

/**
 * Cadastro (a pessoa já entra ao criar a conta).
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (user) => applyAuthenticatedUser(queryClient, user),
  });
}

/**
 * Logout.
 *
 * Limpar o cache PRIVADO é parte do trabalho: carrinho e favoritos eram do
 * usuário que saiu. Se ficassem no cache, o próximo visitante (ou outro usuário,
 * no mesmo navegador) veria dados que não são dele — vazamento de dados entre
 * contas.
 *
 * Por que `resetQueries` e não `removeQueries`: remover uma query ATIVA tira ela
 * do cache, mas os componentes que a observam continuam ligados ao objeto antigo
 * e seguiriam mostrando o dado do usuário que saiu (`removeQueries` é para
 * descartar cache SEM tela usando; ver AGENTS.md §9). `resetQueries` devolve a
 * query ao estado inicial (sem dado) e rebusca as ativas — a tela mostra o
 * carrinho do VISITANTE (vazio) sem nunca exibir o do usuário anterior.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      void queryClient.resetQueries({ queryKey: cartKeys.all });
      void queryClient.resetQueries({ queryKey: favoritesKeys.all });
      queryClient.setQueryData<User | null>(authKeys.session(), null);
      // O catálogo é público: não se mexe nele aqui.
    },
  });
}
