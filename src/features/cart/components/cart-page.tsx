import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NftCarousel } from '@/features/catalog/components/nft-carousel';
import { relatedNftsQueryOptions } from '@/features/catalog/queries';
import { getApiError } from '@/lib/api-error';
import { CartEmpty } from './cart-empty';
import { CartItemRow } from './cart-item-row';
import { CartSkeleton } from './cart-skeleton';
import { CartSummary } from './cart-summary';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../queries';

/**
 * Página do carrinho (conectada).
 *
 * Junta a lista de itens (com edição/quantidade/remoção) e o resumo de valores,
 * além do carrossel "Colecionadores também viram".
 *
 * As mutations de quantidade/remoção são OTIMISTAS: a linha some ou muda na hora
 * e, se a API falhar, o hook faz rollback. O erro aparece acima da lista.
 */
export function CartPage() {
  const cart = useCart();
  const updateQuantity = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const related = useQuery(relatedNftsQueryOptions({ limit: 5 }));

  const mutationError = updateQuantity.error ?? removeItem.error;

  return (
    <div className="mx-auto max-w-[1200px] space-y-10 px-4 py-8 sm:px-6">
      <nav aria-label="Você está aqui">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="transition-colors hover:text-foreground">
              Início
            </Link>
          </li>
          <ChevronRight aria-hidden className="size-4" />
          <li>
            <Link to="/mercado" className="transition-colors hover:text-foreground">
              Mercado
            </Link>
          </li>
          <ChevronRight aria-hidden className="size-4" />
          <li aria-current="page" className="text-foreground">
            Carrinho
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Carrinho de NFTs</h1>

      {cart.isPending ? <CartSkeleton /> : null}

      {cart.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-6 py-16 text-center"
        >
          <TriangleAlert aria-hidden className="size-8 text-destructive" />
          <h2 className="text-lg font-medium">Não foi possível carregar o carrinho</h2>
          <p className="max-w-md text-sm text-muted-foreground">{getApiError(cart.error).message}</p>
          <Button variant="outline" className="mt-1" onClick={() => void cart.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {cart.data && cart.data.items.length === 0 ? <CartEmpty /> : null}

      {cart.data && cart.data.items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
          <section aria-labelledby="cart-items-heading" className="space-y-3">
            <h2 id="cart-items-heading" className="sr-only">
              Itens do carrinho
            </h2>

            {mutationError ? (
              <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {getApiError(mutationError).message}
              </p>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
              {/* Cabeçalho da "tabela" (só no desktop). */}
              <div
                aria-hidden
                className="hidden border-b border-border/60 px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_auto_minmax(0,0.9fr)_auto] md:items-center md:gap-4"
              >
                <span>NFTs</span>
                <span className="md:text-right">Preço</span>
                <span className="md:text-center">Edições</span>
                <span className="md:text-right">Total</span>
                <span className="sr-only">Ações</span>
              </div>

              <ul
                aria-busy={updateQuantity.isPending || removeItem.isPending}
                className="divide-y divide-border/60"
              >
                {cart.data.items.map((item) => {
                  const isUpdating = updateQuantity.isPending && updateQuantity.variables?.itemId === item.id;
                  const isRemoving = removeItem.isPending && removeItem.variables?.itemId === item.id;

                  return (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      isBusy={isUpdating || isRemoving}
                      onChangeQuantity={(quantity) => updateQuantity.mutate({ itemId: item.id, quantity })}
                      onRemove={() => removeItem.mutate({ itemId: item.id })}
                    />
                  );
                })}
              </ul>
            </div>
          </section>

          <div className="lg:sticky lg:top-24">
            <CartSummary cart={cart.data} />
          </div>
        </div>
      ) : null}

      <NftCarousel
        title="Colecionadores também viram"
        nfts={related.data ?? []}
        isLoading={related.isPending}
      />
    </div>
  );
}
