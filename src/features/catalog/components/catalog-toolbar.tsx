import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import { Input } from '@/components/ui/input';
import type { CatalogTab, NftSort } from '@/types/nft';
import type { CatalogSearch } from '../search-params';

const TABS: { id: CatalogTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
];

const SORTS: { id: NftSort; label: string }[] = [
  { id: 'recent', label: 'Listados recentemente' },
  { id: 'price-asc', label: 'Menor preço' },
  { id: 'price-desc', label: 'Maior preço' },
  { id: 'name-asc', label: 'Nome (A-Z)' },
];

interface CatalogToolbarProps {
  search: CatalogSearch;
  onQueryChange: (q: string) => void;
  onTabChange: (tab: CatalogTab) => void;
  onSortChange: (sort: NftSort) => void;
}

/** Barra do topo dos resultados: busca, abas e ordenação. */
export function CatalogToolbar({ search, onQueryChange, onTabChange, onSortChange }: CatalogToolbarProps) {
  // A busca é digitada localmente e sobe para a URL com debounce: evita criar
  // uma entrada de histórico a cada tecla.
  const [text, setText] = useState(search.q);
  const [syncedQuery, setSyncedQuery] = useState(search.q);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Se a URL mudar por fora (voltar/avançar, "limpar filtros"), ressincroniza o
  // texto. Padrão recomendado pelo React: ajustar estado durante o render.
  if (search.q !== syncedQuery) {
    setSyncedQuery(search.q);
    setText(search.q);
  }

  function handleQuery(value: string) {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onQueryChange(value), 350);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="catalog-search" className="sr-only">
          Buscar NFTs
        </label>
        <Input
          id="catalog-search"
          type="search"
          value={text}
          onChange={(event) => handleQuery(event.target.value)}
          placeholder="Buscar por nome ou número..."
          className="h-10 pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Categorias do catálogo" className="flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={search.tab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm transition-colors',
                search.tab === tab.id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="catalog-sort" className="text-sm text-muted-foreground">
            Ordenar por:
          </label>
          <select
            id="catalog-sort"
            value={search.sort}
            onChange={(event) => onSortChange(event.target.value as NftSort)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {SORTS.map((sort) => (
              <option key={sort.id} value={sort.id} className="bg-card text-foreground">
                {sort.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
