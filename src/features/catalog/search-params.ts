import { z } from 'zod';
import { CATALOG_TABS, NETWORK_IDS, NFT_COLLECTION_IDS, NFT_SORTS } from '@/types/nft';

/**
 * Estado do catálogo que vive na URL.
 *
 * O enunciado exige que busca/filtros/ordenação/paginação componham o estado da
 * URL e sobrevivam a refresh e navegação pelo histórico.
 *
 * Validamos com zod usando `.default()`/`.catch()`: assim valores ausentes ou
 * malformados caem no padrão (sem quebrar a tela) e — consequência importante —
 * o `search` deixa de ser OBRIGATÓRIO nos `<Link>` para estas rotas.
 */
export const catalogSearchSchema = z.object({
  q: z.string().catch('').default(''),
  tab: z.enum(CATALOG_TABS).catch('all').default('all'),
  collections: z.array(z.enum(NFT_COLLECTION_IDS)).catch([]).default([]),
  networks: z.array(z.enum(NETWORK_IDS)).catch([]).default([]),
  priceMin: z.number().optional().catch(undefined),
  priceMax: z.number().optional().catch(undefined),
  sort: z.enum(NFT_SORTS).catch('recent').default('recent'),
  page: z.number().int().positive().catch(1).default(1),
});

/** Estado tipado do catálogo (inferido do schema — fonte única de verdade). */
export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

/** Valores padrão — usados para limpar a URL (`stripSearchParams`). */
export const DEFAULT_CATALOG_SEARCH: CatalogSearch = {
  q: '',
  tab: 'all',
  collections: [],
  networks: [],
  priceMin: undefined,
  priceMax: undefined,
  sort: 'recent',
  page: 1,
};

/**
 * Converte o estado tipado da URL nos parâmetros que a API REST entende.
 * É aqui que layout e transporte se desacoplam: a URL é "bonitinha" para o
 * usuário, e a query string é a que o backend espera.
 */
export function toNftListParams(search: CatalogSearch): Record<string, string | number> {
  const params: Record<string, string | number> = {
    tab: search.tab,
    sort: search.sort,
    page: search.page,
  };
  if (search.q) params.q = search.q;
  if (search.collections.length) params.collections = search.collections.join(',');
  if (search.networks.length) params.networks = search.networks.join(',');
  if (search.priceMin !== undefined) params.priceMin = search.priceMin;
  if (search.priceMax !== undefined) params.priceMax = search.priceMax;
  return params;
}
