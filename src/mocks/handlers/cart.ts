import { delay, http, HttpResponse } from 'msw';
import { computeCartTotals } from '@/lib/cart-totals';
import { multiplyEth, sumEth } from '@/lib/eth';
import type { AddCartItemInput, Cart, CartItem, UpdateCartItemInput } from '@/types/cart';
import { NFT_EDITION_IDS, type Nft, type NftEditionId } from '@/types/nft';
import { findNft } from '../nft-state';
import { findCoupon } from '../fixtures/coupons';
import { getCartRecord, mutateDb, type CartLineRecord } from '../db';
import { mockScenarios } from '../scenarios';
import { getCartScope } from '../session';
import { apiError, networkError } from './http-utils';

/**
 * Handlers REST do carrinho.
 *
 * A "regra de negócio" mora AQUI (lado servidor): merge de linhas, limites de
 * quantidade, disponibilidade por edição, cupom válido/expirado e cálculo dos
 * totais. A interface só envia a intenção e exibe a resposta.
 */

/** Chave estável de uma linha: um NFT em edições diferentes são linhas diferentes. */
export function cartItemId(nftId: string, editionId: NftEditionId): string {
  return `${nftId}:${editionId}`;
}

/** Monta a resposta `Cart` a partir do estado persistido + catálogo atual. */
export function buildCart(scope: string): Cart {
  const record = getCartRecord(scope);
  const items: CartItem[] = [];

  for (const line of record.lines) {
    const nft = findNft(line.nftId);
    // NFT/edição que saiu do catálogo: linha órfã é ignorada (não quebra a tela).
    const edition = nft?.editions.find((item) => item.id === line.editionId);
    if (!nft || !edition) continue;

    items.push({
      id: cartItemId(nft.id, edition.id),
      nftId: nft.id,
      name: nft.name,
      number: nft.number,
      tokenId: nft.tokenId,
      imageUrl: nft.imageUrl,
      editionId: edition.id,
      editionLabel: edition.label,
      unitPriceEth: nft.priceEth,
      quantity: line.quantity,
      available: edition.available,
      maxPerOrder: edition.maxPerOrder,
      unitPriceWhenAddedEth: line.unitPriceWhenAddedEth,
      lineTotalEth: multiplyEth(nft.priceEth, line.quantity),
    });
  }

  const coupon = record.couponCode ? findCoupon(record.couponCode) : undefined;
  const subtotalEth = sumEth(items.map((item) => item.lineTotalEth));

  return {
    items,
    coupon: coupon ? { code: coupon.code, label: coupon.label, percent: coupon.percent } : null,
    totals: computeCartTotals({ subtotalEth, discountPercent: coupon?.percent ?? 0 }),
    updatedAt: new Date().toISOString(),
  };
}

/** Extrai nftId/editionId de uma chave de linha ("nft-001:1-50"). */
function parseCartItemId(itemId: string): { nftId: string; editionId: string } | null {
  const separator = itemId.lastIndexOf(':');
  if (separator <= 0) return null;
  return { nftId: itemId.slice(0, separator), editionId: itemId.slice(separator + 1) };
}

function isEditionId(value: unknown): value is NftEditionId {
  return typeof value === 'string' && (NFT_EDITION_IDS as readonly string[]).includes(value);
}

/** Valida uma quantidade segundo disponibilidade e teto por pedido. */
function validateQuantity(quantity: number, edition: Nft['editions'][number]): Response | null {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return apiError(422, 'VALIDATION_ERROR', 'A quantidade deve ser um número inteiro maior que zero.', {
      quantity: 'Informe ao menos 1 unidade.',
    });
  }
  if (edition.available <= 0) {
    return apiError(409, 'OUT_OF_STOCK', 'Esta edição está esgotada.');
  }
  if (quantity > edition.maxPerOrder) {
    return apiError(422, 'QUANTITY_LIMIT', `O limite por pedido nesta edição é ${edition.maxPerOrder}.`);
  }
  if (quantity > edition.available) {
    return apiError(409, 'OUT_OF_STOCK', `Restam apenas ${edition.available} unidades nesta edição.`);
  }
  return null;
}

function findLine(lines: CartLineRecord[], nftId: string, editionId: string): CartLineRecord | undefined {
  return lines.find((line) => line.nftId === nftId && line.editionId === editionId);
}

/** Envolve handlers de MUTATION com latência e cenários de falha. */
async function withMutationScenarios(): Promise<Response | null> {
  await delay(mockScenarios.cartLatencyMs);
  if (mockScenarios.networkError) return networkError();
  if (mockScenarios.cartMutationFailure) {
    return apiError(503, 'CART_UNAVAILABLE', 'Não foi possível atualizar o carrinho. Tente novamente.');
  }
  return null;
}

export const cartHandlers = [
  // Consulta do carrinho.
  http.get('/api/cart', async ({ request }) => {
    await delay(mockScenarios.cartLatencyMs);
    if (mockScenarios.networkError) return networkError();
    return HttpResponse.json(buildCart(getCartScope(request)));
  }),

  // Inclusão de item (faz merge se o NFT+edição já estiver no carrinho).
  http.post('/api/cart/items', async ({ request }) => {
    const failed = await withMutationScenarios();
    if (failed) return failed;

    const body = (await request.json()) as Partial<AddCartItemInput>;

    if (typeof body.nftId !== 'string' || !isEditionId(body.editionId)) {
      return apiError(422, 'VALIDATION_ERROR', 'Informe o NFT e a edição.');
    }

    const nft = findNft(body.nftId);
    if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.');

    const edition = nft.editions.find((item) => item.id === body.editionId);
    if (!edition) return apiError(404, 'EDITION_NOT_FOUND', 'Edição indisponível para este NFT.');

    const scope = getCartScope(request);
    const record = getCartRecord(scope);
    const existing = findLine(record.lines, nft.id, edition.id);
    const nextQuantity = (existing?.quantity ?? 0) + (body.quantity ?? 1);

    const invalid = validateQuantity(nextQuantity, edition);
    if (invalid) return invalid;

    mutateDb((draft) => {
      let cart = draft.carts[scope];
      if (!cart) {
        cart = { lines: [], couponCode: null };
        draft.carts[scope] = cart;
      }
      const line = findLine(cart.lines, nft.id, edition.id);
      if (line) {
        line.quantity = nextQuantity;
      } else {
        cart.lines.push({
          nftId: nft.id,
          editionId: edition.id,
          quantity: nextQuantity,
          // Guardamos o preço do momento da inclusão para sinalizar mudanças depois.
          unitPriceWhenAddedEth: nft.priceEth,
        });
      }
    });

    return HttpResponse.json(buildCart(scope));
  }),

  // Alteração de quantidade de uma linha.
  http.patch('/api/cart/items/:itemId', async ({ params, request }) => {
    const failed = await withMutationScenarios();
    if (failed) return failed;

    const parsed = parseCartItemId(String(params.itemId));
    if (!parsed || !isEditionId(parsed.editionId)) {
      return apiError(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado no carrinho.');
    }

    const nft = findNft(parsed.nftId);
    const edition = nft?.editions.find((item) => item.id === parsed.editionId);
    if (!nft || !edition) return apiError(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado no carrinho.');

    const body = (await request.json()) as Partial<UpdateCartItemInput>;
    const quantity = body.quantity;
    if (typeof quantity !== 'number') {
      return apiError(422, 'VALIDATION_ERROR', 'Informe a quantidade.', { quantity: 'Campo obrigatório.' });
    }

    const invalid = validateQuantity(quantity, edition);
    if (invalid) return invalid;

    const scope = getCartScope(request);
    const record = getCartRecord(scope);
    if (!findLine(record.lines, nft.id, edition.id)) {
      return apiError(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado no carrinho.');
    }

    mutateDb((draft) => {
      const line = findLine(draft.carts[scope]?.lines ?? [], nft.id, edition.id);
      if (line) line.quantity = quantity;
    });

    return HttpResponse.json(buildCart(scope));
  }),

  // Remoção de uma linha.
  http.delete('/api/cart/items/:itemId', async ({ params, request }) => {
    const failed = await withMutationScenarios();
    if (failed) return failed;

    const parsed = parseCartItemId(String(params.itemId));
    if (!parsed) return apiError(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado no carrinho.');

    const scope = getCartScope(request);
    const record = getCartRecord(scope);
    if (!findLine(record.lines, parsed.nftId, parsed.editionId)) {
      return apiError(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado no carrinho.');
    }

    mutateDb((draft) => {
      const cart = draft.carts[scope];
      if (!cart) return;
      cart.lines = cart.lines.filter(
        (line) => !(line.nftId === parsed.nftId && line.editionId === parsed.editionId),
      );
    });

    return HttpResponse.json(buildCart(scope));
  }),

  // Aplicação de cupom.
  http.post('/api/cart/coupon', async ({ request }) => {
    const failed = await withMutationScenarios();
    if (failed) return failed;

    const body = (await request.json()) as { code?: unknown };
    if (typeof body.code !== 'string' || body.code.trim() === '') {
      return apiError(422, 'VALIDATION_ERROR', 'Informe o código promocional.', {
        code: 'Campo obrigatório.',
      });
    }

    const coupon = findCoupon(body.code);
    if (!coupon) {
      return apiError(422, 'COUPON_INVALID', 'Código promocional inválido.');
    }
    if (coupon.expiresAt && Date.parse(coupon.expiresAt) < Date.now()) {
      return apiError(422, 'COUPON_EXPIRED', 'Este código promocional expirou.');
    }

    const scope = getCartScope(request);
    mutateDb((draft) => {
      let cart = draft.carts[scope];
      if (!cart) {
        cart = { lines: [], couponCode: null };
        draft.carts[scope] = cart;
      }
      cart.couponCode = coupon.code;
    });

    return HttpResponse.json(buildCart(scope));
  }),

  // Remoção do cupom.
  http.delete('/api/cart/coupon', async ({ request }) => {
    const failed = await withMutationScenarios();
    if (failed) return failed;

    const scope = getCartScope(request);
    mutateDb((draft) => {
      const cart = draft.carts[scope];
      if (cart) cart.couponCode = null;
    });

    return HttpResponse.json(buildCart(scope));
  }),
];
