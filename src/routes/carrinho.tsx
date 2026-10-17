import { createFileRoute } from '@tanstack/react-router';
import { PagePlaceholder } from '@/components/common/page-placeholder';

export const Route = createFileRoute('/carrinho')({
  component: CarrinhoPage,
});

function CarrinhoPage() {
  return (
    <PagePlaceholder
      title="Carrinho de NFTs"
      description="Edição de quantidades, remoção, cupom e resumo de valores. Em construção."
    />
  );
}
