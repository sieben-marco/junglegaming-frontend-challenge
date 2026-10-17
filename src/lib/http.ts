import axios from 'axios';
import { clearAuthToken, getAuthToken } from '@/lib/auth-token';

/**
 * Base URL da API. Em desenvolvimento/preview usamos `/api`, que é
 * interceptado pelo MSW (mock na camada de rede). Em produção real,
 * basta definir VITE_API_URL.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Cliente HTTP único do app (Axios).
 *
 * Todo tráfego REST passa por aqui — e é por isso que os dois interceptors
 * abaixo resolvem, num lugar só, o "idioma" da SESSÃO:
 *  1. REQUISIÇÃO: se há token guardado, ele vai em `Authorization: Bearer …`
 *     (é assim que o "servidor" sabe de quem é o carrinho/favoritos);
 *  2. RESPOSTA: um 401 com token guardado significa que a sessão morreu
 *     (expirou, logout em outra aba...). Descartamos o token AQUI, e toda a
 *     interface volta sozinha ao estado "visitante" (ver `lib/auth-token.ts`).
 */
export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && getAuthToken()) {
      clearAuthToken();
    }
    return Promise.reject(error);
  },
);
