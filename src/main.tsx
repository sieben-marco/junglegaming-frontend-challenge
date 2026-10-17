import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { queryClient } from '@/lib/query-client';
import { enableMocking } from '@/mocks';
import { router } from '@/router';

async function bootstrap() {
  // Liga os mocks (MSW) ANTES de renderizar, para que as primeiras
  // requisições da aplicação já sejam interceptadas.
  await enableMocking();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Elemento #root não encontrado no index.html');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
