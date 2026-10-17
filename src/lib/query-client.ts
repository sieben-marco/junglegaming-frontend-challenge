import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente global do TanStack Query.
 *
 * `defaultOptions` define o comportamento DEFAULT de todas as consultas.
 * Aqui centralizamos a "política de cache" do app (o desafio pede que ela
 * seja documentada — ver ARCHITECTURE.md quando criarmos).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Quanto tempo o dado é considerado "fresco" antes de revalidar sozinho.
      staleTime: 30_000,
      // Quanto tempo o dado fica em cache depois de não ter mais observadores.
      gcTime: 5 * 60_000,
      // Uma tentativa extra em falha (falhas transitórias).
      retry: 1,
      // Não refazer a busca só porque a janela ganhou foco (evita ruído).
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Mutations não devem repetir automaticamente (risco de duplicar pedido).
      retry: 0,
    },
  },
});
