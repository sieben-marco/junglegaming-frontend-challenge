import { createFileRoute } from '@tanstack/react-router';
import { PagePlaceholder } from '@/components/common/page-placeholder';

export const Route = createFileRoute('/entrar')({
  component: EntrarPage,
});

function EntrarPage() {
  return (
    <PagePlaceholder
      title="Entrar"
      description="Autenticação (login) com validação e retorno ao fluxo anterior. Em construção."
    />
  );
}
