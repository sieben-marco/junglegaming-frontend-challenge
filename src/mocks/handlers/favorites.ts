import { delay, http, HttpResponse } from 'msw';
import type { FavoritesResponse } from '@/types/favorite';
import { getFavoriteIds, mutateDb } from '../db';
import { findNftById } from '../fixtures/nfts';
import { mockScenarios } from '../scenarios';
import { getCurrentUserId } from '../session';
import { apiError, networkError } from './http-utils';

/**
 * Handlers REST de favoritos.
 *
 * O enunciado é explícito: favoritos pertencem a um USUÁRIO autenticado. Como a
 * etapa de sessão ainda não existe, `getCurrentUserId()` devolve `null` e estes
 * endpoints respondem 401 — a interface então encaminha para o login, em vez de
 * "fingir" que salvou. Quando o login entrar, nada aqui precisa mudar: basta a
 * sessão passar a resolver o usuário.
 *
 * Os favoritos já ficam ISOLADOS por usuário no banco (`favorites[userId]`),
 * o que evita vazamento de dados entre contas.
 */

type AuthResult = { ok: true; userId: string } | { ok: false; response: Response };

function requireUserId(): AuthResult {
  const userId = getCurrentUserId();
  if (!userId) {
    return {
      ok: false,
      response: apiError(401, 'UNAUTHENTICATED', 'Entre na sua conta para salvar favoritos.'),
    };
  }
  return { ok: true, userId };
}

function toResponse(userId: string): FavoritesResponse {
  // Só devolvemos NFTs que ainda existem no catálogo.
  const nftIds = getFavoriteIds(userId).filter((id) => findNftById(id) !== undefined);
  return { nftIds };
}

/** Latência simulada das áreas privadas (reusa o cenário do carrinho). */
async function privateLatency(): Promise<Response | null> {
  await delay(mockScenarios.cartLatencyMs);
  return mockScenarios.networkError ? networkError() : null;
}

export const favoritesHandlers = [
  // Consulta dos favoritos do usuário da sessão.
  http.get('/api/favorites', async () => {
    const failed = await privateLatency();
    if (failed) return failed;

    const auth = requireUserId();
    if (!auth.ok) return auth.response;

    return HttpResponse.json(toResponse(auth.userId));
  }),

  // Inclusão de um favorito.
  http.post('/api/favorites', async ({ request }) => {
    const failed = await privateLatency();
    if (failed) return failed;

    const auth = requireUserId();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as { nftId?: unknown };
    if (typeof body.nftId !== 'string') {
      return apiError(422, 'VALIDATION_ERROR', 'Informe o NFT a favoritar.');
    }
    if (!findNftById(body.nftId)) {
      return apiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.');
    }

    mutateDb((draft) => {
      const ids = draft.favorites[auth.userId];
      if (ids) {
        if (!ids.includes(body.nftId as string)) ids.push(body.nftId as string);
      } else {
        draft.favorites[auth.userId] = [body.nftId as string];
      }
    });

    return HttpResponse.json(toResponse(auth.userId));
  }),

  // Remoção de um favorito.
  http.delete('/api/favorites/:nftId', async ({ params }) => {
    const failed = await privateLatency();
    if (failed) return failed;

    const auth = requireUserId();
    if (!auth.ok) return auth.response;

    const nftId = String(params.nftId);
    mutateDb((draft) => {
      const ids = draft.favorites[auth.userId];
      if (ids) draft.favorites[auth.userId] = ids.filter((id) => id !== nftId);
    });

    return HttpResponse.json(toResponse(auth.userId));
  }),
];
