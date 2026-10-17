import { delay, http, HttpResponse } from 'msw';
import type { Nft, NftFacets, NftListResponse, NftReviewsResponse } from '@/types/nft';
import { COLLECTIONS, NETWORKS, NFTS, NFT_PAGE_SIZE, NFT_PRICE_BOUNDS, findReviewsByNft } from '../fixtures/nfts';
import { mockScenarios } from '../scenarios';
import { apiError, networkError } from './http-utils';

/**
 * Handlers REST do catálogo de NFTs.
 *
 * A "regra de negócio" dos mocks mora AQUI, não nos componentes. Os handlers
 * leem os parâmetros que o app realmente envia pela API e devolvem respostas
 * tipadas (`NftListResponse`). Facetas e faixa de preço são derivadas das
 * fixtures, garantindo consistência entre filtros e contagens.
 */

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function sortNfts(items: Nft[], sort: string): Nft[] {
  const sorted = [...items];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => Number(a.priceEth) - Number(b.priceEth));
    case 'price-desc':
      return sorted.sort((a, b) => Number(b.priceEth) - Number(a.priceEth));
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    // "recent" é o padrão (listados recentemente).
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

function buildFacets(source: Nft[]): NftFacets {
  return {
    collections: COLLECTIONS.map((collection) => ({
      id: collection.id,
      name: collection.name,
      count: source.filter((nft) => nft.collectionId === collection.id).length,
    })),
    networks: NETWORKS.map((network) => ({
      id: network.id,
      name: network.name,
      count: source.filter((nft) => nft.networkId === network.id).length,
    })),
  };
}

export const catalogHandlers = [
  // Listagem com busca, filtros, ordenação e paginação.
  http.get('/api/nfts', async ({ request }) => {
    await delay(mockScenarios.catalogLatencyMs);

    if (mockScenarios.networkError) return networkError();

    if (mockScenarios.catalogFailure) {
      return apiError(500, 'CATALOG_UNAVAILABLE', 'Não foi possível carregar o catálogo.');
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const tab = url.searchParams.get('tab') ?? 'all';
    const collections = parseCsv(url.searchParams.get('collections'));
    const networks = parseCsv(url.searchParams.get('networks'));
    const priceMin = parseNumber(url.searchParams.get('priceMin'));
    const priceMax = parseNumber(url.searchParams.get('priceMax'));
    const sort = url.searchParams.get('sort') ?? 'recent';
    const page = Math.max(1, parseNumber(url.searchParams.get('page')) ?? 1);
    const pageSize = Math.max(1, parseNumber(url.searchParams.get('pageSize')) ?? NFT_PAGE_SIZE);

    // Quando as facetas são calculadas sobre TODAS as fixtures, os filtros não
    // "somem" ao selecionar um item (comportamento esperado de marketplace).
    const facets = buildFacets(NFTS);

    let items = mockScenarios.catalogEmpty ? ([] as Nft[]) : [...NFTS];

    if (q) items = items.filter((nft) => `${nft.name} #${nft.number}`.toLowerCase().includes(q));
    if (tab === 'new') items = items.filter((nft) => nft.isNew);
    if (tab === 'trending') items = items.filter((nft) => nft.trending);
    if (collections.length) items = items.filter((nft) => collections.includes(nft.collectionId));
    if (networks.length) items = items.filter((nft) => networks.includes(nft.networkId));
    if (priceMin !== undefined) items = items.filter((nft) => Number(nft.priceEth) >= priceMin);
    if (priceMax !== undefined) items = items.filter((nft) => Number(nft.priceEth) <= priceMax);

    items = sortNfts(items, sort);

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    const body = {
      items: pageItems,
      page,
      pageSize,
      total,
      totalPages,
      facets,
      priceRange: NFT_PRICE_BOUNDS,
    } satisfies NftListResponse;

    return HttpResponse.json(body);
  }),

  // Detalhe por identificador.
  http.get('/api/nfts/:id', async ({ params }) => {
    await delay(mockScenarios.catalogLatencyMs);

    if (mockScenarios.networkError) return networkError();

    const nft = NFTS.find((item) => item.id === params.id);
    if (!nft) {
      return apiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.');
    }

    return HttpResponse.json(nft satisfies Nft);
  }),

  // Avaliações de colecionadores (aba do detalhe).
  http.get('/api/nfts/:id/reviews', async ({ params }) => {
    await delay(mockScenarios.catalogLatencyMs);

    if (mockScenarios.networkError) return networkError();

    const nft = NFTS.find((item) => item.id === params.id);
    if (!nft) {
      return apiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.');
    }

    const body: NftReviewsResponse = {
      items: findReviewsByNft(nft.id),
      average: nft.rating.average,
      count: nft.rating.count,
    };

    return HttpResponse.json(body);
  }),
];
