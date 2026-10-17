import { useQuery } from '@tanstack/react-query';
import { RatingStars } from '@/components/common/rating-stars';
import { NftCarousel } from '@/features/catalog/components/nft-carousel';
import { relatedNftsQueryOptions } from '@/features/catalog/queries';
import { formatEthLabel } from '@/lib/eth';
import type { Nft } from '@/types/nft';
import { usePurchaseActions } from '../use-purchase-actions';
import { usePurchaseSelection } from '../use-purchase';
import { NftDetailTabs } from './nft-detail-tabs';
import { NftGallery } from './nft-gallery';
import { NftMetadata } from './nft-metadata';
import { NftPurchaseBar } from './nft-purchase-bar';
import { NftPurchaseControls } from './nft-purchase-controls';

/**
 * Conteúdo do detalhe (dados já carregados).
 *
 * É o "dono" do estado de compra: cria a seleção (edição + quantidade) e as
 * ações, e as repassa ao painel do desktop e à barra fixa do mobile.
 *
 * Recebe `key={nft.id}` do componente pai: assim, ao navegar para outro NFT, o
 * estado reinicia — sem `useEffect` para "sincronizar" props com estado.
 */
export function NftDetailContent({ nft }: { nft: Nft }) {
  const selection = usePurchaseSelection(nft);
  const actions = usePurchaseActions(nft, selection);

  const related = useQuery(
    relatedNftsQueryOptions({ collectionId: nft.collectionId, limit: 5, excludeId: nft.id }),
  );

  return (
    // `pb-28` no mobile evita que a barra fixa cubra o fim do conteúdo.
    <div className="space-y-12 pb-28 md:pb-0">
      <div className="grid gap-8 md:grid-cols-2">
        <NftGallery nft={nft} actions={actions} />

        <div className="space-y-6">
          <header className="space-y-2">
            <p className="text-sm text-muted-foreground">{nft.collectionName}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {nft.name} #{nft.number}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <RatingStars average={nft.rating.average} />
              <span className="text-sm text-muted-foreground">
                {nft.rating.count} avaliações de colecionadores
              </span>
            </div>
          </header>

          <div className="space-y-1">
            <p className="flex items-center gap-3">
              <span className="text-2xl font-medium text-primary">{formatEthLabel(nft.priceEth)}</span>
              {nft.previousPriceEth ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatEthLabel(nft.previousPriceEth)}
                </span>
              ) : null}
            </p>
            <p className="text-sm text-muted-foreground">
              {nft.available === 0
                ? 'Esgotado'
                : `${nft.available} ${nft.available === 1 ? 'unidade disponível' : 'unidades disponíveis'}`}
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-medium">Sobre este NFT:</h2>
            <p className="text-sm text-muted-foreground">{nft.description}</p>
          </section>

          <NftPurchaseControls nft={nft} selection={selection} actions={actions} />

          <NftMetadata nft={nft} />
        </div>
      </div>

      <NftDetailTabs nft={nft} />

      <NftCarousel
        title="Mais desta coleção"
        nfts={related.data ?? []}
        isLoading={related.isPending}
      />

      <NftPurchaseBar nft={nft} selection={selection} actions={actions} />
    </div>
  );
}
