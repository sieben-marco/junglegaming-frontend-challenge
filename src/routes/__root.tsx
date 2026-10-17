import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { SiteFooter } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { NewsletterBand } from '@/components/layout/newsletter-band';
import { useSessionBootstrap } from '@/features/auth/queries';
import { useNftUpdates } from '@/features/realtime/use-nft-updates';

export const Route = createRootRoute({
  component: RootLayout,
});

/**
 * Layout raiz: envolve TODAS as rotas. Tudo que é comum a todas as páginas
 * (header, footer, fundo) fica aqui. A rota atual é renderizada no <Outlet />.
 */
function RootLayout() {
  // Uma única assinatura de tempo real para o app inteiro (`nft.updated`).
  useNftUpdates();

  // Uma única leitura da SESSÃO para o app inteiro: ao abrir/recarregar em
  // qualquer tela, o app pergunta ao "servidor" quem é o dono do token guardado.
  useSessionBootstrap();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <NewsletterBand />
      <SiteFooter />

      {/*
        Devtools só em desenvolvimento — e desligáveis por env para os testes E2E,
        porque o botão flutuante fica sobre a barra fixa de compra no mobile e
        atrapalharia cliques reais (nada de `force: true` para contornar).
      */}
      {import.meta.env.DEV && import.meta.env.VITE_DISABLE_DEVTOOLS !== 'true' ? (
        <>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      ) : null}
    </div>
  );
}
