import { delay, http, HttpResponse } from 'msw';
import type { LoginInput, LoginResponse, SessionResponse } from '@/types/auth';
import {
  createSession,
  findSession,
  findUserByEmail,
  findUserById,
  getCartRecord,
  mutateDb,
  removeSession,
  type CartRecord,
} from '../db';
import { hashPassword, toPublicUser } from '../fixtures/users';
import { findNft } from '../nft-state';
import { GUEST_SCOPE, readBearerToken } from '../session';
import { apiError } from './http-utils';

/**
 * Handlers REST de CONTA e SESSÃO.
 *
 * Regras que moram aqui (lado servidor) e não na tela:
 *  - credenciais: compara-se o DIGEST da senha, nunca a senha em claro;
 *  - a mesma resposta (401 `INVALID_CREDENTIALS`) para e-mail inexistente e
 *    senha errada — não entregamos QUAL dos dois errou;
 *  - a sessão nasce no login e é resolvida pelo TOKEN das requisições seguintes;
 *  - ao entrar, o carrinho do VISITANTE é mesclado no do usuário.
 */

/** Latência das rotas de conta (login precisa "sentir" que houve ida à rede). */
const AUTH_LATENCY_MS = 220;

/**
 * Soma as linhas de `from` no carrinho `to`.
 *
 * Mesmas regras do carrinho normal: linha cujo NFT/edição sumiu do catálogo é
 * descartada, quantidade é somada e limitada ao teto por pedido e ao estoque.
 */
function mergeCartLines(to: CartRecord, from: CartRecord): void {
  for (const line of from.lines) {
    const edition = findNft(line.nftId)?.editions.find((item) => item.id === line.editionId);
    if (!edition || edition.available <= 0) continue;

    const existing = to.lines.find(
      (item) => item.nftId === line.nftId && item.editionId === line.editionId,
    );
    const quantity = Math.min(
      (existing?.quantity ?? 0) + line.quantity,
      edition.maxPerOrder,
      edition.available,
    );
    if (quantity <= 0) continue;

    if (existing) existing.quantity = quantity;
    else to.lines.push({ ...line, quantity });
  }
}

/**
 * "Preservar os itens do visitante ao autenticar" (requisito do enunciado).
 *
 * O que era do visitante passa a ser do usuário e o carrinho de visitante é
 * esvaziado (ele foi "consumido" na entrada). A tela não faz nada disso: ela
 * apenas rebusca o carrinho depois do login.
 */
function mergeGuestCartIntoUserCart(userId: string): void {
  const guestCart = getCartRecord(GUEST_SCOPE);
  if (guestCart.lines.length === 0 && guestCart.couponCode === null) return;

  const userCart = getCartRecord(userId);

  mutateDb(() => {
    mergeCartLines(userCart, guestCart);

    // O cupom do visitante é aproveitado se a conta ainda não tiver um.
    if (userCart.couponCode === null && guestCart.couponCode) {
      userCart.couponCode = guestCart.couponCode;
    }

    guestCart.lines = [];
    guestCart.couponCode = null;
  });
}

export const authHandlers = [
  // Login: valida credenciais, mescla o carrinho do visitante e abre a sessão.
  http.post('/api/auth/login', async ({ request }) => {
    await delay(AUTH_LATENCY_MS);

    const body = (await request.json().catch(() => null)) as Partial<LoginInput> | null;
    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
      return apiError(422, 'VALIDATION_ERROR', 'Informe e-mail e senha.');
    }

    const user = findUserByEmail(body.email);
    if (!user || user.passwordHash !== hashPassword(body.password)) {
      return apiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    mergeGuestCartIntoUserCart(user.id);
    const { token } = createSession(user.id);

    const response: LoginResponse = { user: toPublicUser(user), token };
    return HttpResponse.json(response);
  }),

  // Consulta da sessão: é o que permite RECUPERAR a sessão após um refresh.
  http.get('/api/auth/session', async ({ request }) => {
    await delay(AUTH_LATENCY_MS);

    const token = readBearerToken(request);
    const session = token ? findSession(token) : undefined;
    if (!token || !session) {
      return apiError(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.');
    }

    if (session.expiresAt <= Date.now()) {
      removeSession(token);
      return apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.');
    }

    const user = findUserById(session.userId);
    if (!user) {
      removeSession(token);
      return apiError(401, 'UNAUTHENTICATED', 'Sessão inválida.');
    }

    const response: SessionResponse = { user: toPublicUser(user) };
    return HttpResponse.json(response);
  }),
];
