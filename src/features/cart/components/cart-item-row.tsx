import { Trash } from 'lucide-react';
import { QuantityStepper } from '@/components/common/quantity-stepper';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';
import { NftImage } from '@/features/catalog/components/nft-image';
import { formatEthLabel } from '@/lib/eth';
import type { CartItem } from '@/types/cart';

interface CartItemRowProps {
  item: CartItem;
  /** Uma mutation deste item está em andamento. */
  isBusy: boolean;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}

/**
 * Uma linha do carrinho.
 *
 * No desktop vira uma "linha de tabela" (NFT | Preço | Edição/Qtd | Total | 🗑);
 * no mobile, os mesmos blocos se empilham. A quantidade nunca passa do limite
 * (`min(disponível, teto por pedido)`) — o servidor também valida.
 */
export function CartItemRow({ item, isBusy, onChangeQuantity, onRemove }: CartItemRowProps) {
  const title = `${item.name} #${item.number}`;
  const maxQuantity = Math.max(1, Math.min(item.available, item.maxPerOrder));
  const priceChanged = item.unitPriceEth !== item.unitPriceWhenAddedEth;
  const soldOut = item.available <= 0;

  return (
    <li className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_auto_minmax(0,0.9fr)_auto] md:items-center">
      <div className="flex items-center gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-border/60">
          <NftImage nft={item} />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">ID do token: #{item.tokenId}</p>

          {soldOut ? (
            <p className="text-xs text-destructive">Edição esgotada — remova ou volte depois.</p>
          ) : null}
          {priceChanged ? (
            <p className="text-xs text-primary">Preço atualizado para {formatEthLabel(item.unitPriceEth)}.</p>
          ) : null}
        </div>
      </div>

      <p className="text-sm md:text-right">
        <span className="text-muted-foreground md:hidden">Preço: </span>
        {formatEthLabel(item.unitPriceEth)}
      </p>

      <div className="flex flex-col gap-1 md:items-center">
        <span className="text-xs text-muted-foreground">Edição: {item.editionLabel}</span>
        <QuantityStepper
          value={item.quantity}
          max={maxQuantity}
          disabled={soldOut}
          isBusy={isBusy}
          label={`Quantidade de ${title}`}
          onChange={onChangeQuantity}
        />
      </div>

      <p className="text-sm font-medium md:text-right">
        <span className="text-muted-foreground md:hidden">Total: </span>
        {formatEthLabel(item.lineTotalEth)}
      </p>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Remover ${title} do carrinho`}
        title="Remover item"
        disabled={isBusy}
        onClick={onRemove}
        className={cn('justify-self-start text-muted-foreground hover:text-destructive md:justify-self-end')}
      >
        <Trash aria-hidden />
      </Button>
    </li>
  );
}
