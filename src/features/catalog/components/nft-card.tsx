import { Link } from '@tanstack/react-router';
import { Eye, Heart, ShoppingCart } from 'lucide-react';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import type { Nft } from '@/types/nft';
import { formatEthLabel } from '../format';
import { NftImage } from './nft-image';

const RARITY_LABEL: Record<NonNullable<Nft['rarity']>, string> = {
  raro: 'RARO',
  epico: 'ÉPICO',
  lendario: 'LENDÁRIO',
};

const ACTION_CLASS =
  'flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Card de NFT do grid do catálogo. */
export function NftCard({ nft }: { nft: Nft }) {
  const title = `${nft.name} #${nft.number}`;
  const soldOut = nft.available === 0;

  return (
    <article className="group/card relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 transition-colors hover:border-primary/50">
      <div className="relative aspect-square overflow-hidden">
        <NftImage nft={nft} className="transition-transform duration-300 group-hover/card:scale-105" />
        {nft.rarity ? (
          <Badge className="absolute top-3 left-3 font-semibold tracking-wide uppercase">
            {RARITY_LABEL[nft.rarity]}
          </Badge>
        ) : null}
        {soldOut ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-destructive">
            Esgotado
          </span>
        ) : null}
      </div>

      <div className="space-y-1 p-4">
        <p className="truncate text-sm text-muted-foreground">{title}</p>
        <p className="flex items-center gap-2">
          <span className="font-medium text-primary">{formatEthLabel(nft.priceEth)}</span>
          {nft.previousPriceEth ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatEthLabel(nft.previousPriceEth)}
            </span>
          ) : null}
        </p>
      </div>

      {/* Link "esticado": cobre o card inteiro sem aninhar interativos dentro de <a>. */}
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        aria-label={`Ver ${title}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Ações do design (aparecem no hover/foco). Carrinho e favorito entram nas
          próximas etapas: por ora ficam DESABILITADAS para não fingir sucesso. */}
      <div className="pointer-events-none absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 transition-opacity group-hover/card:pointer-events-auto group-hover/card:opacity-100 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100">
        <button type="button" disabled aria-label="Adicionar ao carrinho (em breve)" title="Em breve" className={cn(ACTION_CLASS, 'cursor-not-allowed opacity-50')}>
          <ShoppingCart className="size-4" />
        </button>
        <button type="button" disabled aria-label="Favoritar (em breve)" title="Em breve" className={cn(ACTION_CLASS, 'cursor-not-allowed opacity-50')}>
          <Heart className="size-4" />
        </button>
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} aria-label={`Ver detalhes de ${title}`} className={ACTION_CLASS}>
          <Eye className="size-4" />
        </Link>
      </div>
    </article>
  );
}
