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

/**
 * Edições (séries) em que um NFT é vendido. A "ABERTA" não tem tiragem fixa.
 * A FONTE ÚNICA dos ids é esta lista `as const`: dela saem o tipo TS e o enum
 * usado para validar o payload na API.
 */
export const NFT_EDITION_IDS = ['1-1', '1-10', '1-50', 'open'] as const;

export type NftEditionId = (typeof NFT_EDITION_IDS)[number];

/** Uma edição disponível para compra. */
export interface NftEdition {
  id: NftEditionId;
  /** Rótulo como aparece no design (ex.: "1/1", "ABERTA"). */
  label: string;
  /** Unidades disponíveis nesta edição (0 = esgotada). */
  available: number;
  /** Teto de unidades por pedido (o "limite de quantidade"). */
  maxPerOrder: number;
}

/** Nota do NFT (média de 0 a 5 + número de avaliações). */
export interface NftRating {
  average: number;
  count: number;
}

/** Uma avaliação de colecionador (aba "Avaliações de colecionadores"). */
export interface NftReview {
  id: string;
  author: string;
  /** Nota de 1 a 5 (inteira). */
  rating: number;
  comment: string;
  createdAt: string;
}

/** Resposta de `GET /api/nfts/:id/reviews`. */
export interface NftReviewsResponse {
  items: NftReview[];
  average: number;
  count: number;
}

/** Um NFT como trafega na API. */
export interface Nft {
  id: string;
  /** Nome sem o número (ex.: "Emerald Ape"). */
  name: string;
  /** Número da edição (ex.: "042"). */
  number: string;
  /** Identificador on-chain (ex.: "0042" — a UI exibe "#0042"). */
  tokenId: string;
  collectionId: NftCollectionId;
  collectionName: string;
  networkId: NetworkId;
  networkName: string;
  /** Preço em ETH como string decimal (precisão preservada no transporte). */
  priceEth: string;
  /** Preço antigo, quando há promoção (exibido riscado). */
  previousPriceEth?: string;
  rarity?: NftRarity;
  /** Unidades disponíveis somando todas as edições (0 = esgotado). */
  available: number;
  /** Edições em que este NFT é vendido (pelo menos uma). */
  editions: NftEdition[];
  rating: NftRating;
  /** Descrição curta exibida no painel e na aba de detalhes. */
  description: string;
  /** Atributos exibidos na linha "Atributos". */
  attributes: string[];
  /** Endereço do contrato (ERC-721) exibido nos metadados. */
  contractAddress: string;
  /** Direitos autorais do criador (%) nas vendas secundárias. */
  royaltiesPercent: number;
  /** Indica que a obra tem "arte desbloqueável" para colecionadores. */
  hasUnlockedContent: boolean;
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
