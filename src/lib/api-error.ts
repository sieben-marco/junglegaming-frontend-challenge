import axios from 'axios';
import type { ApiErrorBody } from '@/types/api';

/**
 * Normaliza qualquer erro em um `ApiErrorBody` previsível para a interface.
 *
 * Erros de API (4xx/5xx) trazem o corpo padronizado; erros de rede/timeout não
 * têm resposta. A UI sempre lida com o MESMO formato, independente da origem.
 */
const FALLBACK: Omit<ApiErrorBody, 'status'> = {
  code: 'UNKNOWN_ERROR',
  message: 'Algo deu errado. Tente novamente em instantes.',
};

export function getApiError(error: unknown): ApiErrorBody {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    if (body && typeof body === 'object' && 'message' in body) {
      return {
        status,
        code: body.code || FALLBACK.code,
        message: body.message || FALLBACK.message,
        details: body.details,
      };
    }
    return { status, ...FALLBACK };
  }
  return { status: 0, ...FALLBACK };
}
