import { createFileRoute } from '@tanstack/react-router';
import { PagePlaceholder } from '@/components/common/page-placeholder';

export const Route = createFileRoute('/aprenda')({
  component: AprendaPage,
});

function AprendaPage() {
  return (
    <PagePlaceholder
      title="Aprenda"
      description="Área editorial fora do escopo da entrega. Não simula funcionalidade."
    />
  );
}
