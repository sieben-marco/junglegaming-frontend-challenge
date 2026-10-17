import type { NftEditionId } from '@/types/nft';
import { USER_FIXTURES, type UserRecord } from './fixtures/users';

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

/** Uma sessão aberta (o "servidor" guarda o token e até quando ele vale). */
export interface SessionRecord {
  userId: string;
  /** Quando a sessão deixa de valer (epoch em ms) — o enunciado pede expiração. */
  expiresAt: number;
}

interface MockDbState {
  /** Um carrinho por escopo (visitante ou usuário logado). */
  carts: Record<string, CartRecord>;
  /** Ids de NFTs favoritados, por id de usuário. */
  favorites: Record<string, string[]>;
  /** Alterações de NFTs, por id (o catálogo "de agora", não o fixture inicial). */
  nftPatches: Record<string, NftPatch>;
  /** Contas do servidor (começa com as fixtures; o cadastro adiciona mais). */
  users: UserRecord[];
  /** Sessões abertas: token ⇒ usuário + validade. */
  sessions: Record<string, SessionRecord>;
}

/** Chave de armazenamento + versão (mudou a forma ⇒ começa limpo). */
export const MOCK_DB_STORAGE_KEY = 'kurio:mock-db';
const MOCK_DB_VERSION = 3;

/** Quanto tempo uma sessão simulada dura (2 horas). */
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

function createInitialState(): MockDbState {
  return {
    carts: {},
    favorites: {},
    nftPatches: {},
    // Copiamos as fixtures: o estado é MUTÁVEL (o cadastro empurra contas novas)
    // e não queremos escrever no módulo de fixtures.
    users: USER_FIXTURES.map((user) => ({ ...user })),
    sessions: {},
  };
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

/* ---------------------------------------------------------------------------
 * Contas e sessões (o "servidor" de autenticação)
 * ------------------------------------------------------------------------- */

/** Contas cadastradas no "servidor". */
export function findUserByEmail(email: string): UserRecord | undefined {
  const normalized = email.trim().toLowerCase();
  return state.users.find((user) => user.email.trim().toLowerCase() === normalized);
}

export function findUserById(userId: string): UserRecord | undefined {
  return state.users.find((user) => user.id === userId);
}

/** Cadastra uma conta nova (usado pelo cadastro — o id já vem pronto). */
export function addUser(user: UserRecord): void {
  mutateDb((draft) => {
    draft.users.push(user);
  });
}

/**
 * Abre uma SESSÃO e devolve o token que o cliente deve guardar.
 *
 * Quem gera o token é o "servidor" (como aconteceria de verdade): o cliente só
 * o repassa em `Authorization: Bearer <token>`.
 */
export function createSession(userId: string): { token: string; expiresAt: number } {
  const token = createSessionToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  mutateDb((draft) => {
    draft.sessions[token] = { userId, expiresAt };
  });
  return { token, expiresAt };
}

/** Sessão de um token (ou `undefined` se o token não existe mais). */
export function findSession(token: string): SessionRecord | undefined {
  return state.sessions[token];
}

/** Encerra UMA sessão (logout). */
export function removeSession(token: string): void {
  mutateDb((draft) => {
    delete draft.sessions[token];
  });
}

/** Encerra TODAS as sessões de um usuário (ex.: troca de senha). */
export function removeSessionsForUser(userId: string): void {
  mutateDb((draft) => {
    for (const [token, session] of Object.entries(draft.sessions)) {
      if (session.userId === userId) delete draft.sessions[token];
    }
  });
}

/**
 * Vence TODAS as sessões agora — ferramenta de dev/teste.
 *
 * Serve para exercitar o que o enunciado chama de "trate expiração durante a
 * navegação": o token do cliente continua "existindo", mas o servidor o recusa.
 */
export function expireSessions(): number {
  const expiredAt = Date.now() - 1;
  const tokens = Object.keys(state.sessions);
  mutateDb((draft) => {
    for (const token of tokens) {
      draft.sessions[token] = { ...draft.sessions[token], expiresAt: expiredAt };
    }
  });
  return tokens.length;
}

function createSessionToken(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `kurio_${cryptoApi.randomUUID()}`;
  }
  return `kurio_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
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
