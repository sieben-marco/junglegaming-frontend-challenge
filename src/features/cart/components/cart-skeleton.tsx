import { Shimmer } from '@/components/common/shimmer';

/**
 * Esqueleto do carrinho: imita a lista + o resumo para não haver "pulo" de
 * layout quando os dados chegam.
 */
export function CartSkeleton() {
  return (
    <div aria-hidden className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
      <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/60">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className="flex items-center gap-4 px-4 py-4">
            <Shimmer className="size-16 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-40" />
              <Shimmer className="h-3 w-24" />
            </div>
            <Shimmer className="hidden h-4 w-16 sm:block" />
            <Shimmer className="h-8 w-24 rounded-full" />
          </li>
        ))}
      </ul>

      <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-5">
        <Shimmer className="h-8 w-full" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-4 w-2/3" />
        <Shimmer className="h-10 w-full" />
      </div>
    </div>
  );
}
