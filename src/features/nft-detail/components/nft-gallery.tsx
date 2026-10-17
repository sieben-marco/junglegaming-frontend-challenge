import { useState } from 'react';
import { Heart, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NftImage } from '@/features/catalog/components/nft-image';
import { cn } from 'cn';
import type { Nft } from '@/types/nft';
import type { PurchaseActions } from '../use-purchase-actions';

interface NftGalleryProps {
  nft: Nft;
  /** Ações de compra/favorito (compartilhadas com o painel e a barra do mobile). */
  actions: PurchaseActions;
}

/**
 * Galeria do detalhe.
 *
 * O design mostra 4 thumbnails porque cada NFT tinha várias imagens. Como o dev
 * forneceu UMA arte por NFT (reutilizada ciclicamente), a coluna de thumbnails
 * só aparece quando houver mais de uma imagem — nada de inventar galeria.
 *
 * A lupa abre um DIALOG (foco preso + `Esc` para fechar, via Base UI Dialog) e,
 * no MOBILE, o coração de favoritar fica sobre a imagem — como no Figma (lá o
 * painel não tem os botões de compra, que vivem na barra fixa do rodapé).
 */
export function NftGallery({ nft, actions }: NftGalleryProps) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const label = `Arte digital ${nft.name} #${nft.number}`;
  const hasImage = Boolean(nft.imageUrl);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/60">
        <NftImage nft={nft} />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {hasImage ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Ampliar imagem"
              className="rounded-full bg-background/85 backdrop-blur hover:bg-background"
              onClick={() => setZoomOpen(true)}
            >
              <ZoomIn />
            </Button>
          ) : null}

          {/* Só no mobile: o desktop tem o botão "Favoritar" no painel. */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-pressed={actions.isFavorite}
            aria-label={`${actions.isFavorite ? 'Remover dos' : 'Adicionar aos'} favoritos`}
            disabled={actions.isTogglingFavorite}
            onClick={actions.toggleFavorite}
            className="rounded-full bg-background/85 backdrop-blur hover:bg-background md:hidden"
          >
            <Heart aria-hidden className={cn(actions.isFavorite && 'fill-primary text-primary')} />
          </Button>
        </div>
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-3xl gap-0 p-3">
          <DialogTitle className="sr-only">{label}</DialogTitle>
          <div className="aspect-square overflow-hidden rounded-xl">
            <NftImage nft={nft} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
