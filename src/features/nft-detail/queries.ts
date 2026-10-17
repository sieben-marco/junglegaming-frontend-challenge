import { queryOptions } from '@tanstack/react-query';
import { fetchNftReviews } from './api';

/**
 * Chaves de cache do detalhe.
 *
 * Ficam sob a raiz `['catalog']` porque descrevem o mesmo recurso — quando um
 * `nft.updated` chegar (etapa de tempo real), invalidar `['catalog']` cobre
 * catálogo, detalhe e avaliações de uma vez.
 */
export const nftDetailKeys = {
  reviews: (id: string) => ['catalog', 'detail', id, 'reviews'] as const,
};

export function nftReviewsQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftDetailKeys.reviews(id),
    queryFn: () => fetchNftReviews(id),
    staleTime: 60_000,
  });
}
