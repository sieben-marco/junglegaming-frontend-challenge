import { http } from '@/lib/http';
import type { FavoritesResponse } from '@/types/favorite';

/**
 * Acesso à API de favoritos.
 *
 * Estes endpoints exigem SESSÃO. Sem login, o servidor simulado responde 401 e
 * a interface encaminha para /entrar (não fingimos que salvou).
 */

export async function fetchFavorites(): Promise<FavoritesResponse> {
  const { data } = await http.get<FavoritesResponse>('/favorites');
  return data;
}

export async function addFavorite(nftId: string): Promise<FavoritesResponse> {
  const { data } = await http.post<FavoritesResponse>('/favorites', { nftId });
  return data;
}

export async function removeFavorite(nftId: string): Promise<FavoritesResponse> {
  const { data } = await http.delete<FavoritesResponse>(`/favorites/${encodeURIComponent(nftId)}`);
  return data;
}
