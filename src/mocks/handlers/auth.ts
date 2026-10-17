import { delay, http, HttpResponse } from 'msw';
import type { LoginInput, LoginResponse, RegisterInput, SessionResponse } from '@/types/auth';
import {
  addUser,
  createSession,
  findSession,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  getCartRecord,
  mutateDb,
  nextUserId,
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
 *  - o cadastro valida o formulário de novo e responde CONFLITO (409) quando
 *    e-mail/nome de usuário já existem;
 *  - a sessão nasce no login/cadastro e é resolvida pelo TOKEN das requisições
 *    seguintes; o logout encerra a sessão no servidor;
 *  - ao entrar, o carrinho do VISITANTE é mesclado no do usuário.
 */

/** Latência das rotas de conta (login precisa "sentir" que houve ida à rede). */
const AUTH_LATENCY_MS = 220;

/** Regras do cadastro — as mesmas que o cliente usa, para valer nos dois lados. */
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 6;

/** Valida o cadastro como o servidor faria e devolve os erros POR CAMPO. */
function validateRegisterInput(input: RegisterInput): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (!USERNAME_PATTERN.test(input.username.trim())) {
    errors.username = 'Use de 3 a 20 caracteres (letras, números e _).';
  }
  if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = 'Informe um e-mail válido.';
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

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

  // Cadastro: valida, checa CONFLITO (e-mail/nome de usuário) e já entra.
  http.post('/api/auth/register', async ({ request }) => {
    await delay(AUTH_LATENCY_MS);

    const body = (await request.json().catch(() => null)) as Partial<RegisterInput> | null;
    if (
      !body ||
      typeof body.username !== 'string' ||
      typeof body.email !== 'string' ||
      typeof body.password !== 'string'
    ) {
      return apiError(422, 'VALIDATION_ERROR', 'Preencha todos os campos.');
    }

    const input: RegisterInput = {
      username: body.username.trim(),
      email: body.email.trim(),
      password: body.password,
    };

    const fieldErrors = validateRegisterInput(input);
    if (fieldErrors) {
      return apiError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', fieldErrors);
    }

    // CONFLITO: 409 com o campo culpado em `details` (a tela destaca o certo).
    // E-mail e usuário são comparados sem diferenciar maiúsculas/minúsculas.
    if (findUserByEmail(input.email)) {
      return apiError(409, 'EMAIL_IN_USE', 'Este e-mail já está em uso.', {
        email: 'Já existe uma conta com este e-mail.',
      });
    }
    if (findUserByUsername(input.username)) {
      return apiError(409, 'USERNAME_IN_USE', 'Este nome de usuário já está em uso.', {
        username: 'Escolha outro nome de usuário.',
      });
    }

    // O Figma não separa "nome de exibição" de "nome de usuário": o que a pessoa
    // digita serve para os dois. A senha entra no banco só como DIGEST.
    const user = {
      id: nextUserId(),
      username: input.username,
      displayName: input.username,
      email: input.email,
      passwordHash: hashPassword(input.password),
    };
    addUser(user);

    mergeGuestCartIntoUserCart(user.id);
    const { token } = createSession(user.id);

    const response: LoginResponse = { user: toPublicUser(user), token };
    return HttpResponse.json(response, { status: 201 });
  }),

  // Logout: encerra a sessão do token no "servidor".
  //
  // De propósito é IDEMPOTENTE (204 mesmo sem token válido): sair duas vezes não
  // é erro. Quem apaga o token do lado do cliente é o próprio app.
  http.post('/api/auth/logout', async ({ request }) => {
    await delay(AUTH_LATENCY_MS);

    const token = readBearerToken(request);
    if (token && findSession(token)) removeSession(token);

    return new HttpResponse(null, { status: 204 });
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
