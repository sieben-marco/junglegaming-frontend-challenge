import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import type { Nft } from '@/types/nft';
import { NftCard } from './nft-card';
import { NftCardSkeleton } from './nft-card-skeleton';

interface NftCarouselProps {
  title: string;
  nfts: Nft[];
  isLoading?: boolean;
  skeletonCount?: number;
  className?: string;
}

/**
 * Carrossel horizontal de cards de NFT.
 *
 * Usado em "Mais desta coleção" (detalhe) e "Colecionadores também viram"
 * (carrinho). Implementação com SCROLL NATIVO + scroll-snap: funciona no teclado,
 * no touch e com leitores de tela sem reimplementar arrasto.
 *
 * Acessibilidade: a seção tem `aria-label`; as setas são botões rotulados e o
 * track é uma lista. Os "pontos" indicam a página atual do scroll.
 */
export function NftCarousel({ title, nfts, isLoading = false, skeletonCount = 5, className }: NftCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);

  function syncScrollState(): void {
    const track = trackRef.current;
    if (!track) return;
    const nextPages = Math.max(1, Math.round(track.scrollWidth / track.clientWidth));
    const nextPage = Math.min(nextPages - 1, Math.round(track.scrollLeft / track.clientWidth));
    setPages(nextPages);
    setPage(nextPage);
  }

  function scrollByPage(direction: 1 | -1): void {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * direction, behavior: 'smooth' });
  }

  function scrollToPage(target: number): void {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * target, behavior: 'smooth' });
  }

  const showControls = !isLoading && nfts.length > 0;

  return (
    <section aria-label={title} className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>

        {showControls ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              aria-label={`Ver itens anteriores de ${title}`}
              disabled={page <= 0}
              onClick={() => scrollByPage(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              aria-label={`Ver mais itens de ${title}`}
              disabled={page >= pages - 1}
              onClick={() => scrollByPage(1)}
            >
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </div>

      <ul
        ref={trackRef}
        onScroll={syncScrollState}
        aria-busy={isLoading}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <li key={index} className="w-56 shrink-0 snap-start sm:w-60">
                <NftCardSkeleton />
              </li>
            ))
          : nfts.map((nft) => (
              <li key={nft.id} className="w-56 shrink-0 snap-start sm:w-60">
                <NftCard nft={nft} />
              </li>
            ))}
      </ul>

      {showControls && pages > 1 ? (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir para a página ${index + 1} de ${pages}`}
              aria-current={index === page}
              onClick={() => scrollToPage(index)}
              className={cn(
                'size-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                index === page ? 'bg-primary' : 'bg-border',
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
