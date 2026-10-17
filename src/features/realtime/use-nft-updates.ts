import { useEffect, useRef } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { catalogKeys } from '@/features/catalog/queries';
import { createSocket } from '@/lib/socket';
import type { Nft, NftListResponse } from '@/types/nft';
import type { NftUpdateEvent } from '@/types/realtime';

/**
 * Assina os eventos de tempo real do catálogo (`nft.updated`).
 *
 * Montado UMA vez, no layout raiz: assim qualquer tela se atualiza com a
 * conexão aberta (é o mesmo comportamento de um app real, onde o socket é
 * global).
 *
 * O trabalho do listener:
 *  1. DESCARTAR eventos duplicados/antigos (o `version` é sempre crescente);
 *  2. aplicar o dado novo nos caches que já existem (sem refetch).
 *
 * Por que aplicar no cache em vez de "invalidar e buscar de novo"? Porque o
 * evento já traz o dado novo — pedir de novo à API só para exibir o mesmo valor
 * seria um round-trip à toa. O REST continua sendo a verdade (a mesma mudança é
 * aplicada no "servidor"), então qualquer refetch devolve o mesmo preço.
 */

/** Troca o preço do NFT afetado dentro dos dados em cache. */
function withUpdatedPrice(data: unknown, update: NftUpdateEvent): unknown {
  // Carrosséis: uma lista simples de NFTs.
  if (Array.isArray(data)) {
    return data.map((item) => replacePrice(item, update));
  }

  // Listagem paginada: `{ items: Nft[], ... }`.
  if (data && typeof data === 'object' && 'items' in data) {
    const page = data as NftListResponse;
    return { ...page, items: page.items.map((item) => replacePrice(item, update)) };
  }

  return data;
}

function replacePrice(item: unknown, update: NftUpdateEvent): unknown {
  if (item && typeof item === 'object' && (item as Nft).id === update.id) {
    return { ...(item as Nft), priceEth: update.priceEth };
  }
  return item;
}

/** Aplica a mudança no detalhe e nas listagens JÁ em cache. */
function applyNftUpdate(queryClient: QueryClient, update: NftUpdateEvent): void {
  queryClient.setQueryData<Nft | undefined>(catalogKeys.detail(update.id), (previous) =>
    previous ? { ...previous, priceEth: update.priceEth } : previous,
  );

  queryClient.setQueriesData<unknown>({ queryKey: catalogKeys.all }, (previous: unknown) =>
    withUpdatedPrice(previous, update),
  );
}

export function useNftUpdates(): void {
  const queryClient = useQueryClient();
  /** Última versão aplicada por NFT — a memória que descarta eventos antigos. */
  const appliedVersion = useRef(new Map<string, number>());

  useEffect(() => {
    let socket: Socket | undefined;
    /** Marca que o efeito já foi limpo (StrictMode desmonta e monta de novo). */
    let disposed = false;

    function handleNftUpdate(update: NftUpdateEvent): void {
      const current = appliedVersion.current.get(update.id) ?? 0;

      // Duplicata (mesma versão) ou evento que chegou ATRASADO (versão menor):
      // ignorar é o correto — nunca regredir um estado mais recente.
      if (update.version <= current) return;

      appliedVersion.current.set(update.id, update.version);
      applyNftUpdate(queryClient, update);
    }

    // `createSocket` é assíncrono porque carrega o `socket.io-client` sob
    // demanda (ver o porquê em `lib/socket.ts`: o MSW precisa estar ativo
    // antes de o engine.io-client "fotografar" o WebSocket global).
    void createSocket().then((created) => {
      if (disposed) {
        created.disconnect();
        return;
      }

      socket = created;
      socket.on('nft.updated', handleNftUpdate);

      if (import.meta.env.DEV) {
        socket.on('connect_error', (error) => {
          console.warn('[realtime] falha ao conectar no socket:', error.message);
        });
      }

      socket.connect();
    });

    // Limpeza: sem isso, um HMR/re-montagem deixaria listeners e conexões soltos.
    return () => {
      disposed = true;
      socket?.off('nft.updated', handleNftUpdate);
      socket?.disconnect();
    };
  }, [queryClient]);
}
