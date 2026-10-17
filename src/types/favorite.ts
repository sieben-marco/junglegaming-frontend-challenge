/**
 * Contratos de favoritos.
 *
 * Favoritos pertencem a um USUÁRIO autenticado (enunciado §3). Enquanto a
 * sessão não existe, a API responde 401 e a interface encaminha o usuário ao
 * login — em vez de "fingir" que salvou.
 */

/** Resposta de `GET /api/favorites` (e das mutations de inclusão/remoção). */
export interface FavoritesResponse {
  /** Ids dos NFTs favoritados pelo usuário da sessão. */
  nftIds: string[];
}

/** Corpo aceito por `POST /api/favorites`. */
export interface AddFavoriteInput {
  nftId: string;
}
