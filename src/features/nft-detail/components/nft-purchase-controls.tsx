import { Heart, LoaderCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantityStepper } from '@/components/common/quantity-stepper';
import { cn } from 'cn';
import { formatEthLabel, multiplyEth } from '@/lib/eth';
import type { Nft } from '@/types/nft';
import type { PurchaseSelection } from '../use-purchase';
import type { PurchaseActions } from '../use-purchase-actions';
import { EditionSelector } from './edition-selector';
import { PurchaseFeedbackMessage } from './purchase-feedback';

interface NftPurchaseControlsProps {
  nft: Nft;
  selection: PurchaseSelection;
  actions: PurchaseActions;
}

/**
 * Controles de compra do PAINEL (desktop): edição, quantidade, comprar e
 * favoritar. No mobile, os mesmos controles aparecem na barra fixa
 * (`nft-purchase-bar.tsx`) — a seleção é a MESMA (estado no pai).
 */
export function NftPurchaseControls({ nft, selection, actions }: NftPurchaseControlsProps) {
  const title = `${nft.name} #${nft.number}`;
  const lineTotal = formatEthLabel(multiplyEth(nft.priceEth, selection.quantity));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Edição:</p>
        <EditionSelector
          editions={selection.editions}
          selectedId={selection.edition.id}
          onSelect={selection.selectEdition}
        />
      </div>

      {/*
        Quantidade, total e ações ficam só no DESKTOP. No mobile o design usa a
        barra fixa do rodapé (`nft-purchase-bar`) para quantidade/preço/compra e
        o coração sobre a imagem para favoritar — repetir os controles aqui
        criaria dois grupos com o MESMO rótulo acessível (confuso em leitor de
        tela) e divergiria do Figma.
      */}
      <div className="hidden space-y-4 md:block">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Quantidade</p>
          <QuantityStepper
            value={selection.quantity}
            max={Math.max(1, selection.maxQuantity)}
            disabled={selection.isSoldOut}
            isBusy={actions.isAdding}
            label={`Quantidade de ${title}`}
            onChange={selection.setQuantity}
          />
        </div>

        {selection.isSoldOut ? (
          <p className="text-sm text-destructive">Esta edição está esgotada.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Total selecionado: <span className="font-medium text-foreground">{lineTotal}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            size="lg"
            className="grow gap-2 text-xs tracking-wider uppercase sm:grow-0"
            disabled={selection.isSoldOut || actions.isAdding}
            onClick={actions.addToCart}
          >
            {actions.isAdding ? <LoaderCircle className="animate-spin" aria-hidden /> : <ShoppingCart aria-hidden />}
            {actions.isAdding ? 'Adicionando…' : 'Comprar'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn('gap-2', actions.isFavorite && 'border-primary text-primary')}
            aria-pressed={actions.isFavorite}
            disabled={actions.isTogglingFavorite}
            onClick={actions.toggleFavorite}
          >
            <Heart aria-hidden className={cn(actions.isFavorite && 'fill-primary')} />
            {actions.isFavorite ? 'Favoritado' : 'Favoritar'}
          </Button>
        </div>

        <PurchaseFeedbackMessage feedback={actions.feedback} />
      </div>
    </div>
  );
}
