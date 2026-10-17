import { useQuery } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { RatingStars } from '@/components/common/rating-stars';
import { Shimmer } from '@/components/common/shimmer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getApiError } from '@/lib/api-error';
import { formatShortDate, truncateAddress } from '@/lib/format';
import type { Nft } from '@/types/nft';
import { nftReviewsQueryOptions } from '../queries';

/**
 * Abas do detalhe: "Detalhes do NFT" e "Avaliações de colecionadores".
 *
 * As avaliações vêm da API (`GET /api/nfts/:id/reviews`) — a aba exibe os mesmos
 * estados das outras telas: carregando, erro (com retry), vazio e sucesso.
 */
export function NftDetailTabs({ nft }: { nft: Nft }) {
  const reviews = useQuery(nftReviewsQueryOptions(nft.id));

  return (
    <Tabs defaultValue="details" className="gap-6">
      <TabsList variant="line" className="w-full justify-start gap-2 border-b border-border/60 pb-1">
        <TabsTrigger value="details" className="flex-none px-2">
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="reviews" className="flex-none px-2">
          Avaliações de colecionadores ({nft.rating.count})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>{nft.description}</p>
        <p>
          A propriedade fica registrada on-chain, com procedência imutável e metadados armazenados no
          IPFS. Cada unidade é verificável pelo contrato, e os royalties do criador são pagos
          automaticamente nas vendas secundárias.
        </p>

        <dl className="space-y-3">
          <div>
            <dt className="font-semibold text-foreground">Rede:</dt>
            <dd>
              Cunhado na {nft.networkName} com procedência imutável e metadados armazenados no IPFS.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Contrato:</dt>
            <dd>Contrato inteligente ERC-721 verificado — {truncateAddress(nft.contractAddress)}.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Direitos autorais:</dt>
            <dd>
              {nft.royaltiesPercent}% nas vendas secundárias, pagos automaticamente pelos mercados
              compatíveis.
            </dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="reviews" className="space-y-5">
        {reviews.isPending ? (
          <ul aria-hidden className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="space-y-2 rounded-xl border border-border/60 bg-card/60 p-4">
                <Shimmer className="h-4 w-32" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-2/3" />
              </li>
            ))}
          </ul>
        ) : null}

        {reviews.isError ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4">
            <p className="flex items-center gap-2 text-sm text-destructive">
              <TriangleAlert aria-hidden className="size-4" />
              {getApiError(reviews.error).message}
            </p>
            <Button variant="outline" size="sm" onClick={() => void reviews.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {reviews.data ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <RatingStars average={reviews.data.average} />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{reviews.data.average.toFixed(1)}</span> de 5
                {' · '}
                {reviews.data.count}{' '}
                {reviews.data.count === 1 ? 'avaliação' : 'avaliações'}
              </p>
            </div>

            {reviews.data.items.length === 0 ? (
              <p className="rounded-xl border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
                Este NFT ainda não recebeu avaliações.
              </p>
            ) : (
              <ul className="space-y-3">
                {reviews.data.items.map((review) => (
                  <li key={review.id} className="rounded-xl border border-border/60 bg-card/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{review.author}</p>
                      <p className="text-xs text-muted-foreground">{formatShortDate(review.createdAt)}</p>
                    </div>
                    <RatingStars average={review.rating} className="mt-1" />
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
