import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Shimmer } from '@/components/common/shimmer';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getApiError } from '@/lib/api-error';
import { cn } from 'cn';
import { NftImage } from '@/features/catalog/components/nft-image';
import { formatEthLabel } from '@/features/catalog/format';
import { nftQueryOptions } from '@/features/catalog/queries';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailPage,
});

const RARITY_LABEL: Record<string, string> = {
  raro: 'RARO',
  epico: 'ÉPICO',
  lendario: 'LENDÁRIO',
};

function NftDetailPage() {
  const { nftId } = Route.useParams();
  const query = useQuery(nftQueryOptions(nftId));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <Link
        to="/mercado"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao mercado
      </Link>

      {query.isPending ? <DetailSkeleton /> : null}

      {query.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-6 py-16 text-center"
        >
          <h1 className="text-lg font-medium">NFT não encontrado</h1>
          <p className="max-w-md text-sm text-muted-foreground">{getApiError(query.error).message}</p>
          <Link to="/mercado" className={cn(buttonVariants({ variant: 'outline' }), 'mt-1')}>
            Explorar o catálogo
          </Link>
        </div>
      ) : null}

      {query.data ? <DetailContent nft={query.data} /> : null}
    </div>
  );
}

function DetailContent({ nft }: { nft: import('@/types/nft').Nft }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/60">
        <NftImage nft={nft} />
        {nft.rarity ? (
          <Badge className="absolute top-4 left-4 font-semibold tracking-wide uppercase">
            {RARITY_LABEL[nft.rarity]}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{nft.collectionName}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {nft.name} #{nft.number}
          </h1>
        </div>

        <p className="flex items-center gap-2">
          <span className="text-xl font-medium text-primary">{formatEthLabel(nft.priceEth)}</span>
          {nft.previousPriceEth ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatEthLabel(nft.previousPriceEth)}
            </span>
          ) : null}
        </p>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <dt className="text-muted-foreground">Rede</dt>
            <dd className="mt-0.5 font-medium">{nft.networkName}</dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <dt className="text-muted-foreground">Disponibilidade</dt>
            <dd className={cn('mt-0.5 font-medium', nft.available === 0 && 'text-destructive')}>
              {nft.available === 0 ? 'Esgotado' : `${nft.available} disponíveis`}
            </dd>
          </div>
        </dl>

        {/* TODO(produto): edição, quantidade, favoritos e compra entram na etapa do detalhe. */}
        <p className="text-xs text-muted-foreground">
          Edição, favoritos e compra serão habilitados na próxima etapa do detalhe.
        </p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Shimmer className="aspect-square rounded-2xl" />
      <div className="space-y-4">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-8 w-2/3" />
        <Shimmer className="h-6 w-32" />
        <Shimmer className="h-20 w-full" />
      </div>
    </div>
  );
}
