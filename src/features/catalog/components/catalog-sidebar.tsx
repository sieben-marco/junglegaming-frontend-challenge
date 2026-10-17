import { cn } from 'cn';
import { Shimmer } from '@/components/common/shimmer';
import type { CatalogSearch } from '../search-params';
import type { NftCollectionId, NftFacets, NetworkId, PriceRange } from '@/types/nft';
import { PriceRangeFilter } from './price-range-filter';

interface FilterOptionProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function FilterOption({ label, count, active, onClick }: FilterOptionProps) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
          active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        )}
      >
        <span className="truncate">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      </button>
    </li>
  );
}

interface CatalogSidebarProps {
  search: CatalogSearch;
  facets: NftFacets | undefined;
  priceRange: PriceRange | undefined;
  idPrefix: string;
  onToggleCollection: (id: NftCollectionId) => void;
  onToggleNetwork: (id: NetworkId) => void;
  onApplyPrice: (min: number, max: number) => void;
}

/** Sidebar de filtros do catálogo (coleções, preço e rede). */
export function CatalogSidebar({
  search,
  facets,
  priceRange,
  idPrefix,
  onToggleCollection,
  onToggleNetwork,
  onApplyPrice,
}: CatalogSidebarProps) {
  if (!facets || !priceRange) {
    return (
      <div className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-5">
        <Shimmer className="h-5 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Shimmer key={i} className="h-6 w-full" />
          ))}
        </div>
        <Shimmer className="h-24 w-full" />
      </div>
    );
  }

  return (
    <aside aria-label="Filtros do catálogo" className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-5">
      <section className="space-y-2">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Coleções</h2>
        <ul className="space-y-0.5">
          {facets.collections.map((collection) => (
            <FilterOption
              key={collection.id}
              label={collection.name}
              count={collection.count}
              active={search.collections.includes(collection.id)}
              onClick={() => onToggleCollection(collection.id)}
            />
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Faixa de preço</h2>
        <PriceRangeFilter
          // Remonta o filtro quando os valores aplicados mudam (ex.: "voltar"),
          // resetando o rascunho sem precisar de efeitos de sincronização.
          key={`${search.priceMin ?? ''}:${search.priceMax ?? ''}`}
          bounds={priceRange}
          valueMin={search.priceMin}
          valueMax={search.priceMax}
          idPrefix={idPrefix}
          onApply={onApplyPrice}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Rede</h2>
        <ul className="space-y-0.5">
          {facets.networks.map((network) => (
            <FilterOption
              key={network.id}
              label={network.name}
              count={network.count}
              active={search.networks.includes(network.id)}
              onClick={() => onToggleNetwork(network.id)}
            />
          ))}
        </ul>
      </section>
    </aside>
  );
}
