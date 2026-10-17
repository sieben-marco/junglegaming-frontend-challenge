import { HttpResponse } from 'msw';
import type { ApiErrorBody } from '@/types/api';

/**
 * Utilidades compartilhadas pelos handlers do MSW.
 *
 * Todo erro da API sai no MESMO formato (`ApiErrorBody`): a interface nunca
 * precisa adivinhar a forma do erro — `getApiError()` sempre entrega isto.
 */
export function apiError(status: number, code: string, message: string, details?: Record<string, string>) {
  const body: ApiErrorBody = { status, code, message, ...(details ? { details } : {}) };
  return HttpResponse.json(body, { status });
}

/** Falha de rede simulada (sem resposta HTTP), para exercitar a UI. */
export function networkError(): Response {
  return HttpResponse.error();
}
