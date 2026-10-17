import type { NftEditionId } from './nft';

/**
 * Contratos do carrinho.
 *
 * O carrinho é um RECURSO DO SERVIDOR: o cliente nunca calcula preços "por
 * conta própria" na tela — ele exibe o que a API responde (`Cart`). Os valores
 * em ETH são strings decimais; quantidades são inteiros.
 */

/** Uma linha do carrinho (um NFT numa edição específica). */
export interface CartItem {
  /**
   * Chave estável da linha. Um mesmo NFT em edições diferentes são DUAS linhas,
   * então a chave é a composição `nftId:editionId` (não o id do NFT).
   */
  id: string;
  nftId: string;
  name: string;
  number: string;
  /** Identificador on-chain (a UI exibe "#<tokenId>"). */
  tokenId: string;
  imageUrl?: string;
  editionId: NftEditionId;
  editionLabel: string;
  /** Preço unitário vigente (vem da resposta da API). */
  unitPriceEth: string;
  quantity: number;
  /** Disponibilidade atual da edição (pode mudar por `nft.updated`). */
  available: number;
  /** Teto de unidades por pedido (limite de quantidade). */
  maxPerOrder: number;
  /** Preço unitário no momento em que o item foi adicionado. */
  unitPriceWhenAddedEth: string;
  /** Total da linha (`unitPriceEth × quantity`), calculado pela API. */
  lineTotalEth: string;
}

/** Cupom aplicado ao carrinho. */
export interface AppliedCoupon {
  code: string;
  /** Rótulo humano (ex.: "Desconto do lançamento"). */
  label: string;
  /** Percentual de desconto (0 a 100). */
  percent: number;
}

/** Resumo de valores — sempre calculado pela API (fonte da verdade). */
export interface CartTotals {
  subtotalEth: string;
  discountEth: string;
  /** Taxa de rede estimada. */
  networkFeeEth: string;
  totalEth: string;
}

/** O carrinho completo como a API devolve. */
export interface Cart {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  totals: CartTotals;
  /** Versão da resposta — usada para reconciliar com eventos em tempo real. */
  updatedAt: string;
}

/** Corpo aceito por `POST /api/cart/items`. */
export interface AddCartItemInput {
  nftId: string;
  editionId: NftEditionId;
  quantity: number;
}

/** Corpo aceito por `PATCH /api/cart/items/:itemId`. */
export interface UpdateCartItemInput {
  quantity: number;
}
