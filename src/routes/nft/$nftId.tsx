import { createFileRoute } from '@tanstack/react-router';
import { NftDetailPage } from '@/features/nft-detail/components/nft-detail-page';

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailRoute,
});

/**
 * Rota de detalhe. O `$nftId` vem da URL, o que permite ACESSO DIRETO (deep
 * link) e sobreviver ao refresh — requisito do enunciado.
 */
function NftDetailRoute() {
  const { nftId } = Route.useParams();
  return <NftDetailPage nftId={nftId} />;
}
