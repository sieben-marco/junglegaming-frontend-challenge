import { SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import type { CatalogTab, NetworkId, NftCollectionId, NftSort } from '@/types/nft';
import { nftsQueryOptions } from '../queries';
import type { CatalogSearch } from '../search-params';
import { CatalogPagination } from './catalog-pagination';
import { CatalogSidebar } from './catalog-sidebar';
import { CatalogToolbar } from './catalog-toolbar';
import { NftResults } from './nft-results';

interface NftCatalogProps {
  /** Estado atual (vem da URL, via search params da rota). */
  search: CatalogSearch;
  /** Escreve na URL. Mudanças de filtro já resetam a página para 1. */
  onSearchChange: (patch: Partial<CatalogSearch>) => void;
}

/**
 * Bloco completo do catálogo: filtros + busca/abas/ordenação + grid + paginação.
 *
 * É um componente APRESENTACIONAL-CONECTADO: lê dados via TanStack Query e
 * recebe o estado da URL por props, para ser reutilizado em `/` e `/mercado`
 * sem acoplar-se a uma rota específica.
 */
export function NftCatalog({ search, onSearchChange }: NftCatalogProps) {
  const query = useQuery(nftsQueryOptions(search));

  const data = query.data;
  const nfts = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function toggleCollection(id: NftCollectionId) {
    const next = search.collections.includes(id)
      ? search.collections.filter((item) => item !== id)
      : [...search.collections, id];
    onSearchChange({ collections: next, page: 1 });
  }

  function toggleNetwork(id: NetworkId) {
    const next = search.networks.includes(id)
      ? search.networks.filter((item) => item !== id)
      : [...search.networks, id];
    onSearchChange({ networks: next, page: 1 });
  }

  function clearFilters() {
    onSearchChange({
      q: '',
      tab: 'all',
      collections: [],
      networks: [],
      priceMin: undefined,
      priceMax: undefined,
      sort: 'recent',
      page: 1,
    });
  }

  function renderSidebar(idPrefix: string) {
    return (
      <CatalogSidebar
        search={search}
        facets={data?.facets}
        priceRange={data?.priceRange}
        idPrefix={idPrefix}
        onToggleCollection={toggleCollection}
        onToggleNetwork={toggleNetwork}
        onApplyPrice={(priceMin, priceMax) => onSearchChange({ priceMin, priceMax, page: 1 })}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile/tablet: filtros recolhidos num <details> nativo (acessível). */}
      <details className="rounded-2xl border border-border/60 bg-card/60 p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal aria-hidden className="size-4" />
          Filtros
        </summary>
        <div className="mt-4">{renderSidebar('mobile')}</div>
      </details>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div className="hidden lg:block">{renderSidebar('desktop')}</div>

        <div className="space-y-4">
          <CatalogToolbar
            search={search}
            onQueryChange={(q) => onSearchChange({ q, page: 1 })}
            onTabChange={(tab: CatalogTab) => onSearchChange({ tab, page: 1 })}
            onSortChange={(sort: NftSort) => onSearchChange({ sort, page: 1 })}
          />

          <p aria-live="polite" className="text-sm text-muted-foreground">
            {query.isPending
              ? 'Carregando NFTs…'
              : `${total} ${total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}`}
          </p>

          {/* `aria-busy` avisa leitores de tela que a região está atualizando. */}
          <div
            aria-busy={query.isFetching}
            className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}
          >
            <NftResults
              isPending={query.isPending}
              isError={query.isError}
              error={query.error}
              nfts={nfts}
              onRetry={() => void query.refetch()}
              onClearFilters={clearFilters}
            />
          </div>

          {!query.isPending && !query.isError && totalPages > 1 ? (
            <CatalogPagination
              page={search.page}
              totalPages={totalPages}
              onPageChange={(page) => onSearchChange({ page })}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
