import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,
  // Pré-carrega a rota quando o usuário "demonstra intenção" (hover/foco no link).
  defaultPreload: 'intent',
  scrollRestoration: true,
});

// Registra o tipo do nosso router globalmente, para que `Link`, `useNavigate`
// etc. saibam exatamente quais rotas existem (type-safety de rotas).
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
