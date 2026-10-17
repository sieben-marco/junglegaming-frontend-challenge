import { http } from '@/lib/http';
import type { NftReviewsResponse } from '@/types/nft';

/** Avaliações de colecionadores de um NFT (aba de avaliações). */
export async function fetchNftReviews(id: string): Promise<NftReviewsResponse> {
  const { data } = await http.get<NftReviewsResponse>(`/nfts/${encodeURIComponent(id)}/reviews`);
  return data;
}
