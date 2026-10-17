import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/features/auth/components/auth-page';
import { entrarSearchSchema } from './entrar';

/**
 * Cadastro: a MESMA tela de autenticação do login, com a aba "Criar conta"
 * ativa (é o que o Figma mostra). Por isso reaproveitamos o schema do
 * `redirect` — depois de criar a conta, a pessoa volta para onde estava.
 */
export const Route = createFileRoute('/cadastro')({
  validateSearch: entrarSearchSchema,
  component: CadastroPage,
});

function CadastroPage() {
  const { redirect } = Route.useSearch();

  return <AuthPage mode="register" redirect={redirect} />;
}
