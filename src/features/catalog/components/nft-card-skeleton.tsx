import { Shimmer } from '@/components/common/shimmer';

/**
 * Skeleton do card de NFT.
 *
 * Repete a MESMA estrutura/dimensões do `NftCard` (imagem quadrada + 2 linhas)
 * para que a troca skeleton→conteúdo não cause deslocamento de layout (CLS).
 */
export function NftCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
      <Shimmer className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-4 w-1/3" />
      </div>
    </div>
  );
}
