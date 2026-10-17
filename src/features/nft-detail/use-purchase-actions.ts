import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAddCartItem } from '@/features/cart/queries';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/queries';
import { getApiError } from '@/lib/api-error';
import type { Nft } from '@/types/nft';
import type { PurchaseSelection } from './use-purchase';

/**
 * Ações de compra/favorito do detalhe.
 *
 * Concentra as MUTATIONS num só lugar para que o painel (desktop) e a barra fixa
 * (mobile) disparem exatamente o mesmo comportamento, com o mesmo feedback.
 */

export interface PurchaseFeedback {
  tone: 'success' | 'error';
  message: string;
}

export interface PurchaseActions {
  feedback: PurchaseFeedback | null;
  isAdding: boolean;
  isFavorite: boolean;
  isTogglingFavorite: boolean;
  addToCart: () => void;
  toggleFavorite: () => void;
}

export function usePurchaseActions(nft: Nft, selection: PurchaseSelection): PurchaseActions {
  const addToCartMutation = useAddCartItem();
  const favoriteMutation = useToggleFavorite();
  const isFavorite = useIsFavorite(nft.id);
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<PurchaseFeedback | null>(null);

  function addToCart(): void {
    if (selection.isSoldOut) return;
    setFeedback(null);

    addToCartMutation.mutate(
      {
        nftId: nft.id,
        editionId: selection.edition.id,
        quantity: selection.quantity,
        // "Rascunho" da linha para a atualização otimista do carrinho.
        optimistic: {
          nftId: nft.id,
          name: nft.name,
          number: nft.number,
          tokenId: nft.tokenId,
          imageUrl: nft.imageUrl,
          editionId: selection.edition.id,
          editionLabel: selection.edition.label,
          unitPriceEth: nft.priceEth,
          available: selection.edition.available,
          maxPerOrder: selection.edition.maxPerOrder,
        },
      },
      {
        onSuccess: () => setFeedback({ tone: 'success', message: 'Adicionado ao carrinho.' }),
        onError: (error) => setFeedback({ tone: 'error', message: getApiError(error).message }),
      },
    );
  }

  function toggleFavorite(): void {
    setFeedback(null);

    favoriteMutation.mutate(
      { nftId: nft.id, next: !isFavorite },
      {
        onError: (error) => {
          const apiError = getApiError(error);
          // Favoritos exigem sessão: sem login, mandamos para a tela de entrar
          // guardando para onde voltar depois ("retorno ao fluxo anterior").
          if (apiError.status === 401) {
            void navigate({ to: '/entrar', search: { redirect: `/nft/${nft.id}` } });
            return;
          }
          setFeedback({ tone: 'error', message: apiError.message });
        },
      },
    );
  }

  return {
    feedback,
    isAdding: addToCartMutation.isPending,
    isFavorite,
    isTogglingFavorite: favoriteMutation.isPending,
    addToCart,
    toggleFavorite,
  };
}
