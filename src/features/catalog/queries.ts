import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { fetchNft, fetchNfts } from './api';
import type { CatalogSearch } from './search-params';

/**
 * Chaves de cache do catálogo (TanStack Query).
 *
 * Centralizar as chaves evita duplicação e deixa claro como invalidar depois
 * (ex.: quando `nft.updated` chegar via Socket.IO, invalidamos estas chaves).
 */
export const catalogKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (search: CatalogSearch) => [...catalogKeys.lists(), search] as const,
  details: () => [...catalogKeys.all, 'detail'] as const,
  detail: (id: string) => [...catalogKeys.details(), id] as const,
};

/** Opções de query da listagem. `keepPreviousData` evita "piscar" ao paginar. */
export function nftsQueryOptions(search: CatalogSearch) {
  return queryOptions({
    queryKey: catalogKeys.list(search),
    queryFn: () => fetchNfts(search),
    placeholderData: keepPreviousData,
  });
}

/** Opções de query do detalhe. */
export function nftQueryOptions(id: string) {
  return queryOptions({
    queryKey: catalogKeys.detail(id),
    queryFn: () => fetchNft(id),
  });
}
