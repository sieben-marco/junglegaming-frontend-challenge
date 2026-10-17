import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { NftCatalog } from '@/features/catalog/components/nft-catalog';
import { DEFAULT_CATALOG_SEARCH, catalogSearchSchema } from '@/features/catalog/search-params';

export const Route = createFileRoute('/mercado')({
  // Valida/tipa os search params lidos da URL.
  validateSearch: catalogSearchSchema,
  // Remove os valores padrão da URL (ex.: `?page=1` some).
  search: { middlewares: [stripSearchParams(DEFAULT_CATALOG_SEARCH)] },
  component: MercadoPage,
});

function MercadoPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mercado</h1>
        <p className="text-sm text-muted-foreground">
          Explore o catálogo completo com busca, filtros combináveis, ordenação e paginação.
        </p>
      </header>

      <NftCatalog
        search={search}
        onSearchChange={(patch) => void navigate({ search: (prev) => ({ ...prev, ...patch }) })}
      />
    </div>
  );
}
