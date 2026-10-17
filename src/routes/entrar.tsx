import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AuthPage } from '@/features/auth/components/auth-page';

/**
 * Search param `redirect`: guarda PARA ONDE voltar depois do login. É o que o
 * enunciado chama de "retorno ao fluxo anterior". Usamos `.default('')` porque —
 * como aprendemos no catálogo — schema com defaults deixa o `search` opcional
 * nos `<Link>` para esta rota.
 *
 * A tela de CADASTRO compartilha o mesmo schema e a mesma página (ver
 * `routes/cadastro.tsx`), mudando apenas o `mode`.
 */
export const entrarSearchSchema = z.object({
  redirect: z.string().catch('').default(''),
});

export const Route = createFileRoute('/entrar')({
  validateSearch: entrarSearchSchema,
  component: EntrarPage,
});

function EntrarPage() {
  const { redirect } = Route.useSearch();

  return <AuthPage mode="login" redirect={redirect} />;
}
