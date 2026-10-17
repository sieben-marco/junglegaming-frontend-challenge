import { createFileRoute } from '@tanstack/react-router';
import { PagePlaceholder } from '@/components/common/page-placeholder';

export const Route = createFileRoute('/criadores')({
  component: CriadoresPage,
});

function CriadoresPage() {
  return (
    <PagePlaceholder
      title="Criadores"
      description="Área editorial fora do escopo da entrega. Não simula funcionalidade."
    />
  );
}
