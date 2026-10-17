import { http } from '@/lib/http';
import type { Nft, NftListResponse } from '@/types/nft';
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
