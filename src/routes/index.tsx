import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
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
          <div
            aria-hidden
            className="min-h-56 rounded-xl bg-gradient-to-br from-secondary via-muted to-accent"
          />
        </div>
      </section>
    </div>
  );
}
