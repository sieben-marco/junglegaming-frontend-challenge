import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddCartItemInput, Cart } from '@/types/cart';
import { addCartItem, applyCoupon, fetchCart, removeCartItem, removeCoupon, updateCartItem } from './api';
import { applyAdd, applyQuantity, applyRemove, type OptimisticCartItem } from './optimistic';

/**
 * Estado do carrinho via TanStack Query.
 *
 * Chaves de cache centralizadas (uma "raiz" `['cart']` para invalidar tudo de
 * uma vez). O carrinho é um recurso do servidor: sempre que uma mutation
 * termina, invalidamos para RECONCILIAR com a resposta real do servidor.
 */

export const cartKeys = {
  all: ['cart'] as const,
  detail: () => [...cartKeys.all, 'detail'] as const,
};

/**
 * `staleTime: 0` de propósito: o carrinho muda com frequência (inclusive por
 * eventos de tempo real), então queremos revalidar sempre que a tela monta.
 */
export function cartQueryOptions() {
  return queryOptions({
    queryKey: cartKeys.detail(),
    queryFn: fetchCart,
    staleTime: 0,
  });
}

export function useCart() {
  return useQuery(cartQueryOptions());
}

/** Soma das quantidades — usado no badge do header. */
export function useCartCount(): number {
  const { data } = useCart();
  return data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
}

/**
 * Variáveis da inclusão: o que vai para a API + um "rascunho" da linha para a
 * previsão otimista (nome, preço, edição...).
 */
export interface AddToCartVariables extends AddCartItemInput {
  optimistic?: OptimisticCartItem;
}

/**
 * Inclusão de item, com ATUALIZAÇÃO OTIMISTA.
 *
 * Guardamos o carrinho anterior como "contexto"; se a mutation falhar, o
 * `onError` RESTAURA esse snapshot (rollback). No fim (`onSettled`) revalidamos
 * para garantir que o estado exibido é o do servidor.
 */
export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: AddToCartVariables) =>
      addCartItem({
        nftId: variables.nftId,
        editionId: variables.editionId,
        quantity: variables.quantity,
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      const previous = queryClient.getQueryData<Cart>(cartKeys.detail());
      if (previous && variables.optimistic) {
        queryClient.setQueryData(cartKeys.detail(), applyAdd(previous, variables.optimistic, variables.quantity));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(cartKeys.detail(), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/** Quantidade de uma linha, com atualização otimista + rollback. */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { itemId: string; quantity: number }) =>
      updateCartItem(variables.itemId, { quantity: variables.quantity }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      const previous = queryClient.getQueryData<Cart>(cartKeys.detail());
      if (previous) {
        queryClient.setQueryData(cartKeys.detail(), applyQuantity(previous, variables.itemId, variables.quantity));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(cartKeys.detail(), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/** Remoção de linha, com atualização otimista + rollback. */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { itemId: string }) => removeCartItem(variables.itemId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      const previous = queryClient.getQueryData<Cart>(cartKeys.detail());
      if (previous) {
        queryClient.setQueryData(cartKeys.detail(), applyRemove(previous, variables.itemId));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(cartKeys.detail(), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/** Aplicação de cupom (sem otimismo: quem define percentual é o servidor). */
export function useApplyCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { code: string }) => applyCoupon(variables.code),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail(), cart);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/** Remoção do cupom. */
export function useRemoveCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeCoupon(),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail(), cart);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
