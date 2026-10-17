import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { nftQueryOptions } from '@/features/catalog/queries';
import { getApiError } from '@/lib/api-error';
import { cn } from 'cn';
import { NftDetailContent } from './nft-detail-content';
import { NftDetailSkeleton } from './nft-detail-skeleton';

/**
 * Página de detalhe do NFT (conectada): lê o NFT da URL, busca na API e
 * orquestra os estados carregando / erro / sucesso.
 *
 * O 404 é tratado como caso de NEGÓCIO ("NFT não encontrado"), não como falha
 * genérica — o enunciado pede acesso direto pela URL e NFT inexistente.
 */
export function NftDetailPage({ nftId }: { nftId: string }) {
  const query = useQuery(nftQueryOptions(nftId));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <nav aria-label="Você está aqui" className="mb-6">
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
          {query.data ? (
            <>
              <ChevronRight aria-hidden className="size-4" />
              <li aria-current="page" className="text-foreground">
                {query.data.name} #{query.data.number}
              </li>
            </>
          ) : null}
        </ol>
      </nav>

      {query.isPending ? <NftDetailSkeleton /> : null}

      {query.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-6 py-16 text-center"
        >
          <TriangleAlert aria-hidden className="size-8 text-destructive" />
          <h1 className="text-lg font-medium">NFT não encontrado</h1>
          <p className="max-w-md text-sm text-muted-foreground">{getApiError(query.error).message}</p>
          <Link to="/mercado" className={cn(buttonVariants({ variant: 'outline' }), 'mt-1')}>
            Explorar o catálogo
          </Link>
        </div>
      ) : null}

      {/* `key`: ao trocar de NFT, o estado de compra reinicia. */}
      {query.data ? <NftDetailContent key={query.data.id} nft={query.data} /> : null}
    </div>
  );
}
