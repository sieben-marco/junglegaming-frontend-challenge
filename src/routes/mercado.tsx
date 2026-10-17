import { createFileRoute } from '@tanstack/react-router';
import { PagePlaceholder } from '@/components/common/page-placeholder';

export const Route = createFileRoute('/mercado')({
  component: MercadoPage,
});

function MercadoPage() {
  return (
    <PagePlaceholder
      title="Mercado"
      description="Catálogo de NFTs com busca, filtros combináveis, ordenação e paginação (estado na URL). Em construção."
    />
  );
}
