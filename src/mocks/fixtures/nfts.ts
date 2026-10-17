import type { Nft, NftCollectionId, NftEdition, NftEditionId, NftReview, NetworkId } from '@/types/nft';

/**
 * Fixtures do catálogo de NFTs.
 *
 * Geradas de forma DETERMINÍSTICA (mesma saída em toda execução) a partir de um
 * RNG com semente fixa. Assim os testes ficam estáveis e o reset restaura um
 * cenário conhecido.
 *
 * As artes são as 4 fornecidas pelo dev em `public/nfts` (reutilizadas
 * ciclicamente). Quando ele enviar uma arte por NFT, basta ampliar NFT_ARTWORKS.
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

/**
 * Edições possíveis e o TETO de unidades por pedido de cada uma. O teto é o
 * "limite de quantidade" do enunciado; o disponível é sorteado por NFT.
 */
const EDITION_META: { id: NftEditionId; label: string; cap: number }[] = [
  { id: '1-1', label: '1/1', cap: 1 },
  { id: '1-10', label: '1/10', cap: 10 },
  { id: '1-50', label: '1/50', cap: 50 },
  { id: 'open', label: 'ABERTA', cap: 10 },
];

const ATTRIBUTE_POOLS = [
  ['Óculos', 'Capuz', 'Headphones', 'Colar', 'Coroa', 'Máscara', 'Brincos'],
  ['Esmeralda', 'Âmbar', 'Coral', 'Ametista', 'Onyx', 'Rubi', 'Safira'],
  ['Raro', 'Épico', 'Lendário', 'Comum', 'Incomum'],
];

const REVIEW_AUTHORS = [
  'Ana Prado',
  'Bruno Salles',
  'Carla Nunes',
  'Diego Matos',
  'Elisa Ramos',
  'Felipe Andrade',
  'Gabi Rocha',
  'Heitor Lima',
  'Inês Moreira',
  'João Vitor',
  'Karen Dias',
  'Lucas Pires',
];

const REVIEW_COMMENTS = [
  'Arte impecável e o processo de compra foi rápido.',
  'Coleção com curadoria muito boa, recomendo!',
  'Chegou certinho, procedência on-chain confere.',
  'Ótimo acabamento e cores vivas na tela.',
  'Valeu cada wei, o artista manda muito bem.',
  'Entrega instantânea e suporte atencioso.',
  'A peça ficou ainda melhor pessoalmente.',
  'Item raro com história interessante por trás.',
  'Boa experiência, voltarei para comprar mais.',
  'Metadados bem organizados e fáceis de verificar.',
];

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
const DAY_MS = 86_400_000;

/** Escolhe um item determinístico de uma lista. */
function pick<TItem>(rand: () => number, items: TItem[]): TItem {
  return items[Math.floor(rand() * items.length)] as TItem;
}

/** Constrói as edições de um NFT (a "ABERTA" é sempre oferecida). */
function buildEditions(rand: () => number, soldOut: boolean): NftEdition[] {
  const editions: NftEdition[] = [];

  for (const meta of EDITION_META) {
    // Nem toda edição existe para todo NFT (sorteamos quais são oferecidas).
    if (meta.id !== 'open' && rand() < 0.3) continue;

    const available = soldOut ? 0 : Math.min(meta.cap, 1 + Math.floor(rand() * meta.cap));
    editions.push({ id: meta.id, label: meta.label, available, maxPerOrder: meta.cap });
  }

  if (editions.length === 0) {
    editions.push({ id: 'open', label: 'ABERTA', available: soldOut ? 0 : 5, maxPerOrder: 10 });
  }
  return editions;
}

/** Gera as avaliações de um NFT (a média sai delas — nada de número solto). */
function buildReviews(rand: () => number, nftId: string): NftReview[] {
  const count = 3 + Math.floor(rand() * 10);

  return Array.from({ length: count }, (_, k) => ({
    id: `${nftId}-rev-${k + 1}`,
    author: pick(rand, REVIEW_AUTHORS),
    rating: 3 + Math.floor(rand() * 3), // 3 a 5
    comment: pick(rand, REVIEW_COMMENTS),
    createdAt: new Date(BASE_TIME - (k + 1) * DAY_MS).toISOString(),
  }));
}

/** Endereço de contrato pseudo-aleatório, porém determinístico (40 hex). */
function pseudoAddress(seed: number): string {
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const parts = [0, 1, 2, 3, 4].map((k) => hex(Math.imul(seed + k * 7 + 1, 2654435761)));
  return `0x${parts.join('')}`;
}

function buildCatalog(): { nfts: Nft[]; reviewsByNft: Record<string, NftReview[]> } {
  const rand = mulberry32(20261016);
  const nfts: Nft[] = [];
  const reviewsByNft: Record<string, NftReview[]> = {};

  for (let i = 0; i < NFT_COUNT; i += 1) {
    const id = `nft-${String(i + 1).padStart(3, '0')}`;
    const collection = pickWeighted(COLLECTIONS, i, NFT_COUNT, 3);
    const network = pickWeighted(NETWORKS, i, NFT_COUNT, 11);

    const price = 0.02 + rand() * (NFT_PRICE_BOUNDS.max - NFT_PRICE_BOUNDS.min);
    const hasDiscount = rand() < 0.22;

    const rarityRoll = rand();
    const rarity =
      rarityRoll < 0.06 ? 'lendario' : rarityRoll < 0.18 ? 'epico' : rarityRoll < 0.45 ? 'raro' : undefined;

    const soldOut = rand() < 0.08;
    const editions = buildEditions(rand, soldOut);
    const available = editions.reduce((sum, edition) => sum + edition.available, 0);

    const hasUnlockedContent = rand() < 0.5;
    const description =
      `Um colecionável digital finalizado à mão da coleção ${collection.name}, ` +
      `verificado na ${network.name}` +
      (hasUnlockedContent ? ', com arte desbloqueável e acesso para colecionadores.' : '.');

    const reviews = buildReviews(rand, id);
    reviewsByNft[id] = reviews;
    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    nfts.push({
      id,
      name: NAME_POOL[i] as string,
      number: String(Math.floor(rand() * 900) + 10).padStart(3, '0'),
      tokenId: String(Math.floor(rand() * 9000) + 1000),
      collectionId: collection.id,
      collectionName: collection.name,
      networkId: network.id,
      networkName: network.name,
      priceEth: price.toFixed(2),
      previousPriceEth: hasDiscount ? (price + 0.3 + rand() * 1.4).toFixed(2) : undefined,
      rarity,
      available,
      editions,
      rating: { average: Number(average.toFixed(1)), count: reviews.length },
      description,
      attributes: ATTRIBUTE_POOLS.map((pool) => pick(rand, pool)),
      contractAddress: pseudoAddress(i + 1),
      royaltiesPercent: pick(rand, [2.5, 5, 7.5, 10]),
      hasUnlockedContent,
      createdAt: new Date(BASE_TIME - i * 8 * 3_600_000).toISOString(),
      isNew: i < 12,
      trending: rand() > 0.6,
      featured: i % 12 === 0,
      imageUrl: NFT_ARTWORKS[i % NFT_ARTWORKS.length],
    });
  }

  return { nfts, reviewsByNft };
}

const catalog = buildCatalog();

export const NFTS: Nft[] = catalog.nfts;

/** Avaliações por NFT (aba "Avaliações de colecionadores"). */
export const REVIEWS_BY_NFT: Record<string, NftReview[]> = catalog.reviewsByNft;

/** Busca um NFT pelo id (ou `undefined`). */
export function findNftById(id: string): Nft | undefined {
  return NFTS.find((nft) => nft.id === id);
}

/** Busca as avaliações de um NFT (lista vazia se não houver). */
export function findReviewsByNft(id: string): NftReview[] {
  return REVIEWS_BY_NFT[id] ?? [];
}
