import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FavoritesResponse } from '@/types/favorite';
import { addFavorite, fetchFavorites, removeFavorite } from './api';

/**
 * Estado de favoritos via TanStack Query.
 *
 * `retry: false`: sem sessão a API responde 401 e não faz sentido insistir.
 * O toggle é OTIMISTA (a estrela responde na hora) e faz rollback se falhar.
 */

export const favoritesKeys = {
  all: ['favorites'] as const,
  list: () => [...favoritesKeys.all, 'list'] as const,
};

export function favoritesQueryOptions() {
  return queryOptions({
    queryKey: favoritesKeys.list(),
    queryFn: fetchFavorites,
    staleTime: 60_000,
    retry: false,
  });
}

export function useFavorites() {
  return useQuery(favoritesQueryOptions());
}

/** Indica se um NFT está nos favoritos (assumindo "não" enquanto carrega/erro). */
export function useIsFavorite(nftId: string): boolean {
  const { data } = useFavorites();
  return data?.nftIds.includes(nftId) ?? false;
}

/** Alterna o favorito de um NFT, com atualização otimista + rollback. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { nftId: string; next: boolean }) =>
      variables.next ? addFavorite(variables.nftId) : removeFavorite(variables.nftId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: favoritesKeys.list() });

      const previous = queryClient.getQueryData<FavoritesResponse>(favoritesKeys.list());
      if (previous) {
        const nftIds = variables.next
          ? [...new Set([...previous.nftIds, variables.nftId])]
          : previous.nftIds.filter((id) => id !== variables.nftId);
        queryClient.setQueryData(favoritesKeys.list(), { nftIds });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(favoritesKeys.list(), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesKeys.all });
    },
  });
}
