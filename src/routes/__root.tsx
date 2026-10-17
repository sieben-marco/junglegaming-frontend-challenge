import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { SiteFooter } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { NewsletterBand } from '@/components/layout/newsletter-band';

export const Route = createRootRoute({
  component: RootLayout,
});

/**
 * Layout raiz: envolve TODAS as rotas. Tudo que é comum a todas as páginas
 * (header, footer, fundo) fica aqui. A rota atual é renderizada no <Outlet />.
 */
function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <NewsletterBand />
      <SiteFooter />

      {/* Devtools só aparecem em desenvolvimento. */}
      {import.meta.env.DEV ? (
        <>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      ) : null}
    </div>
  );
}
