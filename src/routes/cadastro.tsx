import { createFileRoute } from '@tanstack/react-router';
import { PagePlaceholder } from '@/components/common/page-placeholder';

export const Route = createFileRoute('/cadastro')({
  component: CadastroPage,
});

function CadastroPage() {
  return (
    <PagePlaceholder
      title="Criar conta"
      description="Criação de conta com validação e tratamento de conflito. Em construção."
    />
  );
}
