import { http } from '@/lib/http';
import type { Nft, NftCollectionId, NftListResponse } from '@/types/nft';
import { toNftListParams, type CatalogSearch } from './search-params';

/**
 * Funções de acesso à API do catálogo.
 *
 * Só orquestram a chamada HTTP (Axios) e devolvem dado tipado. NÃO contêm
 * regra de negócio nem respostas fictícias — isso é papel dos handlers do MSW.
 */

export async function fetchNfts(search: CatalogSearch): Promise<NftListResponse> {
  const { data } = await http.get<NftListResponse>('/nfts', { params: toNftListParams(search) });
  return data;
}

export async function fetchNft(id: string): Promise<Nft> {
  const { data } = await http.get<Nft>(`/nfts/${id}`);
  return data;
}

/** Parâmetros do carrossel "Mais desta coleção" / "Colecionadores também viram". */
export interface RelatedNftsInput {
  /** Coleção a priorizar (opcional: sem isso, pega os mais recentes). */
  collectionId?: NftCollectionId;
  /** Quantos cards exibir. */
  limit: number;
  /** NFT a EXCLUIR do resultado (o próprio detalhe, por exemplo). */
  excludeId?: string;
}

/**
 * Busca uma lista curta de NFTs para carrossel.
 *
 * Pede `limit + 1` itens ao servidor porque o excluído pode estar entre eles —
 * assim o carrossel continua cheio.
 */
export async function fetchRelatedNfts({ collectionId, limit, excludeId }: RelatedNftsInput): Promise<Nft[]> {
  const params: Record<string, string | number> = {
    page: 1,
    pageSize: limit + (excludeId ? 1 : 0),
    sort: 'recent',
  };
  if (collectionId) params.collections = collectionId;

  const { data } = await http.get<NftListResponse>('/nfts', { params });
  return data.items.filter((nft) => nft.id !== excludeId).slice(0, limit);
}
