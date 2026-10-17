import { createFileRoute, Link, stripSearchParams } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import { NftCatalog } from '@/features/catalog/components/nft-catalog';
import { DEFAULT_CATALOG_SEARCH, catalogSearchSchema } from '@/features/catalog/search-params';

export const Route = createFileRoute('/')({
  // A Início também hospeda o catálogo; logo, também lê/escreve os mesmos
  // search params (busca, filtros, ordenação e página).
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(DEFAULT_CATALOG_SEARCH)] },
  component: HomePage,
});

function HomePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-2xl bg-card">
        <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
          <div className="flex flex-col gap-5">
            <p className="text-sm text-primary">Bem-vindo à Kurio</p>
            <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance uppercase md:text-5xl">
              Seja dono do futuro da arte digital
            </h1>
            <p className="max-w-md text-muted-foreground">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
            <Link
              to="/mercado"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-fit gap-2 text-xs tracking-wider uppercase',
              )}
            >
              Explorar <ArrowRight />
            </Link>
          </div>
          <img
            src="/nfts/nft-artwork-03.png"
            alt="NFT em destaque: macaco de jaqueta verde e óculos escuros"
            className="min-h-56 w-full rounded-xl object-cover"
          />
        </div>
      </section>

      <section className="mt-10 space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-primary">Catálogo</p>
          <h2 className="text-2xl font-semibold tracking-tight">Descubra novos NFTs</h2>
        </div>

        <NftCatalog
          search={search}
          onSearchChange={(patch) => void navigate({ search: (prev) => ({ ...prev, ...patch }) })}
        />
      </section>
    </div>
  );
}
