import { Shimmer } from '@/components/common/shimmer';

/**
 * Esqueleto do detalhe: reproduz a MESMA grade do conteúdo real (galeria à
 * esquerda, painel à direita) para não haver "salto" (CLS) quando os dados
 * chegam.
 */
export function NftDetailSkeleton() {
  return (
    <div aria-hidden className="space-y-12">
      <div className="grid gap-8 md:grid-cols-2">
        <Shimmer className="aspect-square rounded-2xl" />

        <div className="space-y-5">
          <div className="space-y-2">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-8 w-2/3" />
            <Shimmer className="h-4 w-48" />
          </div>
          <Shimmer className="h-8 w-32" />
          <Shimmer className="h-16 w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Shimmer key={index} className="h-9 w-16 rounded-lg" />
            ))}
          </div>
          <Shimmer className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
