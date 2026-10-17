import { PackageOpen, RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api-error';
import type { Nft } from '@/types/nft';
import { NftCard } from './nft-card';
import { NftCardSkeleton } from './nft-card-skeleton';

interface NftResultsProps {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  nfts: Nft[];
  onRetry: () => void;
  onClearFilters: () => void;
}

/**
 * Região de resultados do catálogo.
 *
 * Concentra os quatro estados exigidos: carregando (skeleton), erro (com
 * retry), vazio (com atalho para limpar filtros) e sucesso.
 */
export function NftResults({ isPending, isError, error, nfts, onRetry, onClearFilters }: NftResultsProps) {
  if (isPending) {
    return (
      <ul aria-hidden className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <li key={i}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    const apiError = getApiError(error);
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-6 py-16 text-center"
      >
        <TriangleAlert aria-hidden className="size-8 text-destructive" />
        <h3 className="text-lg font-medium">Não foi possível carregar o catálogo</h3>
        <p className="max-w-md text-sm text-muted-foreground">{apiError.message}</p>
        <Button variant="outline" onClick={onRetry} className="mt-1">
          <RotateCcw />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-6 py-16 text-center"
      >
        <PackageOpen aria-hidden className="size-8 text-muted-foreground" />
        <h3 className="text-lg font-medium">Nenhum NFT encontrado</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Tente ajustar a busca ou remover alguns filtros.
        </p>
        <Button variant="outline" onClick={onClearFilters} className="mt-1">
          Limpar filtros
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {nfts.map((nft) => (
        <li key={nft.id}>
          <NftCard nft={nft} />
        </li>
      ))}
    </ul>
  );
}
