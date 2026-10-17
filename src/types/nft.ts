import type { Pagination } from './api';

/**
 * Contratos de domínio do catálogo de NFTs.
 *
 * As listas `as const` são a FONTE ÚNICA dos identificadores: delas derivamos as
 * uniões de tipo (TS) e os enums usados para validar a URL (zod).
 */

export const NFT_COLLECTION_IDS = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
] as const;

export type NftCollectionId = (typeof NFT_COLLECTION_IDS)[number];

export const NETWORK_IDS = ['ethereum', 'polygon', 'solana'] as const;

export type NetworkId = (typeof NETWORK_IDS)[number];

export const CATALOG_TABS = ['all', 'new', 'trending'] as const;

export type CatalogTab = (typeof CATALOG_TABS)[number];

export const NFT_SORTS = ['recent', 'price-asc', 'price-desc', 'name-asc'] as const;

export type NftSort = (typeof NFT_SORTS)[number];

/** Selo de raridade exibido sobre a arte. */
export type NftRarity = 'raro' | 'epico' | 'lendario';

/** Um NFT como trafega na API. */
export interface Nft {
  id: string;
  /** Nome sem o número (ex.: "Emerald Ape"). */
  name: string;
  /** Número da edição (ex.: "042"). */
  number: string;
  collectionId: NftCollectionId;
  collectionName: string;
  networkId: NetworkId;
  networkName: string;
  /** Preço em ETH como string decimal (precisão preservada no transporte). */
  priceEth: string;
  /** Preço antigo, quando há promoção (exibido riscado). */
  previousPriceEth?: string;
  rarity?: NftRarity;
  /** Unidades disponíveis (0 = esgotado). */
  available: number;
  /** ISO 8601 — usado para ordenar por "listados recentemente". */
  createdAt: string;
  isNew: boolean;
  trending: boolean;
  featured: boolean;
  /** URL da arte. Ausente ⇒ a UI usa um placeholder (asset pendente). */
  imageUrl?: string;
}

/** Contagem usada nos filtros (coleções/redes) devolvida pela API. */
export interface FacetCount<TId extends string> {
  id: TId;
  name: string;
  count: number;
}

/** Facetas combinadas com os filtros disponíveis. */
export interface NftFacets {
  collections: FacetCount<NftCollectionId>[];
  networks: FacetCount<NetworkId>[];
}

/** Faixa de preço suportada (para o slider min/max). */
export interface PriceRange {
  min: number;
  max: number;
}

/** Resposta de `GET /api/nfts`. */
export interface NftListResponse extends Pagination {
  items: Nft[];
  facets: NftFacets;
  priceRange: PriceRange;
}
