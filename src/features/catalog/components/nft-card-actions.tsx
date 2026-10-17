import { useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { Check, Heart, LoaderCircle, ShoppingCart } from 'lucide-react';
import { cn } from 'cn';
import { useAddCartItem } from '@/features/cart/queries';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/queries';
import { getApiError } from '@/lib/api-error';
import { maxQuantityFor, pickDefaultEdition } from '@/lib/nft-editions';
import type { Nft } from '@/types/nft';

/**
 * Botões do card no estilo "redondo/flutuante" do design.
 *
 * A classe vem do `NftCard` (dono da apresentação), então o visual dos três
 * botões do card fica num lugar só.
 */
interface NftCardActionsProps {
  nft: Nft;
  /** Classe visual dos botões flutuantes do card. */
  buttonClassName?: string;
}

/**
 * Ações rápidas do card do catálogo: adicionar ao carrinho e favoritar.
 *
 * É um componente CONECTADO (fala com a API) e por isso é o único ponto do
 * catálogo que conhece as features de carrinho/favoritos — o `NftCard` continua
 * sendo apresentação.
 *
 * Diferente do detalhe, aqui não há seletor de edição/quantidade (o card é
 * pequeno): usamos a MESMA regra de edição padrão do detalhe e quantidade 1.
 * O servidor é quem valida disponibilidade e teto — se recusar, o erro é
 * anunciado e nada é dado como certo.
 *
 * Acessibilidade: o rótulo de cada botão traz o nome do NFT (há 36 cards na
 * tela) e o resultado sai por uma região `role="status"` que existe desde o
 * primeiro render (leitor de tela anuncia a mudança sem precisar de foco).
 */
export function NftCardActions({ nft, buttonClassName = '' }: NftCardActionsProps) {
  const [message, setMessage] = useState('');
  const addToCart = useAddCartItem();
  const toggleFavorite = useToggleFavorite();
  const isFavorite = useIsFavorite(nft.id);
  const navigate = useNavigate();
  const router = useRouter();

  const title = `${nft.name} #${nft.number}`;
  const edition = pickDefaultEdition(nft);
  const soldOut = maxQuantityFor(edition) <= 0;
  const wasAdded = message === 'Adicionado ao carrinho.';

  function handleAddToCart(): void {
    setMessage('');

    addToCart.mutate(
      {
        nftId: nft.id,
        editionId: edition.id,
        quantity: 1,
        // "Rascunho" da linha para a atualização otimista do carrinho.
        optimistic: {
          nftId: nft.id,
          name: nft.name,
          number: nft.number,
          tokenId: nft.tokenId,
          imageUrl: nft.imageUrl,
          editionId: edition.id,
          editionLabel: edition.label,
          unitPriceEth: nft.priceEth,
          available: edition.available,
          maxPerOrder: edition.maxPerOrder,
        },
      },
      {
        onSuccess: () => setMessage('Adicionado ao carrinho.'),
        onError: (error) => setMessage(getApiError(error).message),
      },
    );
  }

  function handleToggleFavorite(): void {
    setMessage('');

    toggleFavorite.mutate(
      { nftId: nft.id, next: !isFavorite },
      {
        onError: (error) => {
          const apiError = getApiError(error);
          // Favoritos exigem sessão: sem login, mandamos para a tela de entrar
          // guardando a URL atual para retomar o fluxo (a lista com filtros).
          if (apiError.status === 401) {
            void navigate({ to: '/entrar', search: { redirect: router.state.location.href } });
            return;
          }
          setMessage(apiError.message);
        },
      },
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={soldOut ? `${title} está esgotado` : `Adicionar ${title} ao carrinho`}
        title={soldOut ? 'Esgotado' : 'Adicionar ao carrinho'}
        disabled={soldOut || addToCart.isPending}
        onClick={handleAddToCart}
        className={buttonClassName}
      >
        {addToCart.isPending ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        ) : wasAdded ? (
          <Check aria-hidden className="size-4 text-primary" />
        ) : (
          <ShoppingCart aria-hidden className="size-4" />
        )}
      </button>

      <button
        type="button"
        aria-label={`${isFavorite ? 'Remover' : 'Favoritar'} ${title}`}
        title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
        aria-pressed={isFavorite}
        disabled={toggleFavorite.isPending}
        onClick={handleToggleFavorite}
        className={cn(buttonClassName, isFavorite && 'border-primary text-primary')}
      >
        <Heart aria-hidden className={cn('size-4', isFavorite && 'fill-primary')} />
      </button>

      {/* Região viva sempre montada: só o TEXTO muda. */}
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}
