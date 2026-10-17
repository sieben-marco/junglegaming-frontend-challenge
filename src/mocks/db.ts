import type { NftEditionId } from '@/types/nft';

/**
 * "Banco de dados" do servidor simulado (MSW).
 *
 * O enunciado pede mocks com ESTADO CONSISTENTE entre catálogo, favoritos,
 * carrinho, perfil, carteiras e pedidos, e permite persistência local para
 * sustentar o refresh ("Persistência local é permitida para sustentar refresh").
 *
 * Então: guardamos o estado mutável AQUI e espelhamos no `localStorage`. Assim o
 * app fala só REST (`/api/cart`) e o refresh continua funcionando — exatamente
 * como se houvesse um servidor de verdade.
 *
 * IMPORTANTE: só os MOCKS importam este módulo. Nenhum componente/hook/axios
 * pode ler isto (senão haveria "caminho alternativo de negócio").
 */

/** Uma linha "crua" do carrinho (o que realmente persistimos). */
export interface CartLineRecord {
  nftId: string;
  editionId: NftEditionId;
  quantity: number;
  /** Preço unitário quando o item foi adicionado (detecta mudança de preço). */
  unitPriceWhenAddedEth: string;
}

export interface CartRecord {
  lines: CartLineRecord[];
  /** Código do cupom aplicado, ou `null`. */
  couponCode: string | null;
}

/**
 * Alteração de um NFT feita "em produção" (ex.: preço mudou durante a
 * navegação). Guardamos a versão porque ela é o critério de ordem dos eventos:
 * uma versão menor/igual à aplicada deve ser IGNORADA.
 */
export interface NftPatch {
  priceEth: string;
  version: number;
}

interface MockDbState {
  /** Um carrinho por escopo (visitante hoje; usuário após o login). */
  carts: Record<string, CartRecord>;
  /** Ids de NFTs favoritados, por id de usuário. */
  favorites: Record<string, string[]>;
  /** Alterações de NFTs, por id (o catálogo "de agora", não o fixture inicial). */
  nftPatches: Record<string, NftPatch>;
}

/** Chave de armazenamento + versão (mudou a forma ⇒ começa limpo). */
export const MOCK_DB_STORAGE_KEY = 'kurio:mock-db';
const MOCK_DB_VERSION = 2;

function createInitialState(): MockDbState {
  return { carts: {}, favorites: {}, nftPatches: {} };
}

function createEmptyCart(): CartRecord {
  return { lines: [], couponCode: null };
}

function hasLocalStorage(): boolean {
  try {
    return typeof globalThis.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function loadState(): MockDbState {
  if (!hasLocalStorage()) return createInitialState();

  try {
    const raw = globalThis.localStorage.getItem(MOCK_DB_STORAGE_KEY);
    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw) as { version?: number; state?: MockDbState };
    if (parsed.version !== MOCK_DB_VERSION || !parsed.state) return createInitialState();
    return parsed.state;
  } catch {
    // Qualquer lixo no storage não deve quebrar o app: recomeça do zero.
    return createInitialState();
  }
}

let state: MockDbState = loadState();

function persist(): void {
  if (!hasLocalStorage()) return;
  try {
    globalThis.localStorage.setItem(
      MOCK_DB_STORAGE_KEY,
      JSON.stringify({ version: MOCK_DB_VERSION, state }),
    );
  } catch {
    // Storage cheio/indisponível: seguimos só em memória (não quebra a UI).
  }
}

/** Executa uma mudança no estado e persiste (uso típico: dentro dos handlers). */
export function mutateDb(mutator: (draft: MockDbState) => void): void {
  mutator(state);
  persist();
}

/** Carrinho de um escopo (cria vazio se ainda não existir). */
export function getCartRecord(scope: string): CartRecord {
  const existing = state.carts[scope];
  if (existing) return existing;

  const created = createEmptyCart();
  state.carts[scope] = created;
  return created;
}

/** Favoritos de um usuário (cria vazio se ainda não existir). */
export function getFavoriteIds(userId: string): string[] {
  const existing = state.favorites[userId];
  if (existing) return existing;

  const created: string[] = [];
  state.favorites[userId] = created;
  return created;
}

/** Alteração vigente de um NFT (ou `undefined` se ele está como no fixture). */
export function getNftPatch(nftId: string): NftPatch | undefined {
  return state.nftPatches[nftId];
}

/**
 * Registra um novo PREÇO para um NFT e devolve o patch vigente.
 *
 * A versão é incrementada a cada mudança — é o que permite ao cliente
 * descartar eventos duplicados ou que chegaram fora de ordem.
 */
export function patchNftPrice(nftId: string, priceEth: string): NftPatch {
  const next: NftPatch = { priceEth, version: (state.nftPatches[nftId]?.version ?? 0) + 1 };
  mutateDb((draft) => {
    draft.nftPatches[nftId] = next;
  });
  return next;
}

/** Restaura o cenário conhecido (usado por testes e por um botão de dev). */
export function resetMockDb(): void {
  state = createInitialState();
  if (hasLocalStorage()) {
    try {
      globalThis.localStorage.removeItem(MOCK_DB_STORAGE_KEY);
    } catch {
      // Ignora: o estado em memória já foi restaurado.
    }
  }
}
