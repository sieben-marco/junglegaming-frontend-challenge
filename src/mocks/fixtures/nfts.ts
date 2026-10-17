import type { Nft, NftCollectionId, NetworkId } from '@/types/nft';

/**
 * Fixtures do catálogo de NFTs.
 *
 * Geradas de forma DETERMINÍSTICA (mesma saída em toda execução) a partir de um
 * RNG com semente fixa. Assim os testes ficam estáveis e o reset restaura um
 * cenário conhecido. As artes (imageUrl) ainda não existem: a UI usa um
 * placeholder até o dev fornecer os assets (ver AGENTS.md > regra 9).
 */

interface CollectionMeta {
  id: NftCollectionId;
  name: string;
  /** Peso relativo ao Figma; usado só para distribuir as fixtures. */
  weight: number;
}

interface NetworkMeta {
  id: NetworkId;
  name: string;
  weight: number;
}

export const COLLECTIONS: CollectionMeta[] = [
  { id: 'arte-digital', name: 'Arte digital', weight: 33 },
  { id: 'fotografia', name: 'Fotografia', weight: 12 },
  { id: 'musica', name: 'Música', weight: 65 },
  { id: 'arte-3d', name: 'Arte 3D', weight: 39 },
  { id: 'colecionaveis', name: 'Colecionáveis', weight: 23 },
  { id: 'generativa', name: 'Generativa', weight: 17 },
  { id: 'jogos', name: 'Jogos', weight: 19 },
  { id: 'assinaturas', name: 'Assinaturas', weight: 13 },
  { id: 'utilidade', name: 'Utilidade', weight: 18 },
];

export const NETWORKS: NetworkMeta[] = [
  { id: 'ethereum', name: 'Ethereum', weight: 119 },
  { id: 'polygon', name: 'Polygon', weight: 78 },
  { id: 'solana', name: 'Solana', weight: 86 },
];

/** Total de NFTs e itens por página (grid 3×3 do Figma ⇒ 4 páginas). */
export const NFT_COUNT = 36;
export const NFT_PAGE_SIZE = 9;

/** Faixa de preço usada pelo slider (ETH). */
export const NFT_PRICE_BOUNDS = { min: 0.02, max: 12.3 };

/**
 * Artes fornecidas pelo dev (em `public/nfts`). O número do arquivo espelha o
 * nome original ("NFT Artwork NN.png") para manter a rastreabilidade — quando
 * chegarem mais artes, basta adicioná-las nos DOIS lugares (aqui e na pasta).
 * Como há menos artes que NFTs, distribuímos ciclicamente.
 */
export const NFT_ARTWORKS = [
  '/nfts/nft-artwork-03.png',
  '/nfts/nft-artwork-04.png',
  '/nfts/nft-artwork-05.png',
  '/nfts/nft-artwork-11.png',
] as const;

/** RNG determinístico (mulberry32). Mesma semente ⇒ mesma sequência. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Distribui `index` de `count` itens proporcionalmente aos pesos (sem aleatoriedade). */
function pickWeighted<TItem extends { weight: number }>(
  items: TItem[],
  index: number,
  count: number,
  offset: number,
): TItem {
  const pool: TItem[] = [];
  for (const item of items) {
    for (let k = 0; k < item.weight; k += 1) pool.push(item);
  }
  const at = (index * pool.length) / count + offset;
  return pool[Math.floor(at) % pool.length] as TItem;
}

const NAME_POOL = [
  'Emerald Ape',
  'Sage Nomad',
  'Neon Vessel',
  'Cosmic Bloom',
  'Violet Nomad',
  'Ivory Baron',
  'Golden Beat',
  'Golden Signal',
  'Crimson Fox',
  'Lunar Drift',
  'Solar Punk',
  'Azure Monk',
  'Obsidian Owl',
  'Frost Ember',
  'Mystic Kraken',
  'Pixel Rogue',
  'Ruby Serpent',
  'Amber Wisp',
  'Jade Falcon',
  'Silver Nomad',
  'Coral Tide',
  'Onyx Titan',
  'Dusk Wanderer',
  'Echo Mirage',
  'Prism Ghost',
  'Velvet Void',
  'Iron Lotus',
  'Nova Cinder',
  'Quartz Oracle',
  'Shadow Sprout',
  'Terra Form',
  'Zephyr Bloom',
  'Halo Circuit',
  'Mirage Koi',
  'Cobalt Sage',
  'Ember Lynx',
];

const BASE_TIME = Date.UTC(2026, 8, 30, 12, 0, 0); // 2026-09-30T12:00:00Z

function buildNfts(): Nft[] {
  const rand = mulberry32(20261016);

  return Array.from({ length: NFT_COUNT }, (_, i) => {
    const collection = pickWeighted(COLLECTIONS, i, NFT_COUNT, 3);
    const network = pickWeighted(NETWORKS, i, NFT_COUNT, 11);

    const price = 0.02 + rand() * (NFT_PRICE_BOUNDS.max - NFT_PRICE_BOUNDS.min);
    const hasDiscount = rand() < 0.22;

    const rarityRoll = rand();
    const rarity =
      rarityRoll < 0.06 ? 'lendario' : rarityRoll < 0.18 ? 'epico' : rarityRoll < 0.45 ? 'raro' : undefined;

    const available = rand() < 0.08 ? 0 : 1 + Math.floor(rand() * 8);

    return {
      id: `nft-${String(i + 1).padStart(3, '0')}`,
      name: NAME_POOL[i] as string,
      number: String(Math.floor(rand() * 900) + 10).padStart(3, '0'),
      collectionId: collection.id,
      collectionName: collection.name,
      networkId: network.id,
      networkName: network.name,
      priceEth: price.toFixed(2),
      previousPriceEth: hasDiscount ? (price + 0.3 + rand() * 1.4).toFixed(2) : undefined,
      rarity,
      available,
      createdAt: new Date(BASE_TIME - i * 8 * 3_600_000).toISOString(),
      isNew: i < 12,
      trending: rand() > 0.6,
      featured: i % 12 === 0,
      imageUrl: NFT_ARTWORKS[i % NFT_ARTWORKS.length],
    } satisfies Nft;
  });
}

export const NFTS: Nft[] = buildNfts();

/** Busca um NFT pelo id (ou `undefined`). */
export function findNftById(id: string): Nft | undefined {
  return NFTS.find((nft) => nft.id === id);
}
