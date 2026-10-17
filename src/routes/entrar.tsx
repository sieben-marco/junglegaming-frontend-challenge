import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginPage } from '@/features/auth/components/login-page';

/**
 * Search param `redirect`: guarda PARA ONDE voltar depois do login. É o que o
 * enunciado chama de "retorno ao fluxo anterior". Usamos `.default('')` porque —
 * como aprendemos no catálogo — schema com defaults deixa o `search` opcional
 * nos `<Link>` para esta rota.
 */
const entrarSearchSchema = z.object({
  redirect: z.string().catch('').default(''),
});

export const Route = createFileRoute('/entrar')({
  validateSearch: entrarSearchSchema,
  component: EntrarPage,
});

function EntrarPage() {
  const { redirect } = Route.useSearch();

  return <LoginPage redirect={redirect} />;
}
