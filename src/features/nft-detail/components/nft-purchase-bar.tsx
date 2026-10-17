import { Link } from '@tanstack/react-router';
import { LoaderCircle, ShoppingCart } from 'lucide-react';
import { QuantityStepper } from '@/components/common/quantity-stepper';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import { useCartCount } from '@/features/cart/queries';
import { formatEthLabel } from '@/lib/eth';
import type { Nft } from '@/types/nft';
import type { PurchaseSelection } from '../use-purchase';
import type { PurchaseActions } from '../use-purchase-actions';
import { PurchaseFeedbackMessage } from './purchase-feedback';

interface NftPurchaseBarProps {
  nft: Nft;
  selection: PurchaseSelection;
  actions: PurchaseActions;
}

/**
 * Barra fixa de compra do MOBILE (o design pede "Qtd + preço + Comprar NFT" no
 * rodapé). Compartilha a seleção com o painel do desktop; aqui só mudamos o
 * arranjo visual. `md:hidden` garante que ela não apareça no desktop.
 */
export function NftPurchaseBar({ nft, selection, actions }: NftPurchaseBarProps) {
  const cartCount = useCartCount();
  const title = `${nft.name} #${nft.number}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2">
        <PurchaseFeedbackMessage feedback={actions.feedback} />

        <div className="flex items-center gap-3">
          <QuantityStepper
            value={selection.quantity}
            max={Math.max(1, selection.maxQuantity)}
            disabled={selection.isSoldOut}
            isBusy={actions.isAdding}
            label={`Quantidade de ${title}`}
            onChange={selection.setQuantity}
            className="shrink-0"
          />

          <div className="flex min-w-0 flex-col">
            <span className="text-xs text-muted-foreground">Preço</span>
            <span className="truncate text-sm font-medium text-primary">{formatEthLabel(nft.priceEth)}</span>
          </div>

          <Button
            type="button"
            className="flex-1 gap-2 text-xs tracking-wider uppercase"
            disabled={selection.isSoldOut || actions.isAdding}
            onClick={actions.addToCart}
          >
            {actions.isAdding ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {selection.isSoldOut ? 'Esgotado' : 'Comprar NFT'}
          </Button>

          <Link
            to="/carrinho"
            aria-label={`Abrir carrinho com ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'relative shrink-0 rounded-full')}
          >
            <ShoppingCart aria-hidden />
            {cartCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </div>
  );
}
