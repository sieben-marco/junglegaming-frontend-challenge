import axios from 'axios';

/**
 * Base URL da API. Em desenvolvimento/preview usamos `/api`, que é
 * interceptado pelo MSW (mock na camada de rede). Em produção real,
 * basta definir VITE_API_URL.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Cliente HTTP único do app (Axios).
 *
 * Todo tráfego REST passa por aqui. Interceptors de request/response
 * (ex.: injetar credenciais de sessão, normalizar erros) serão adicionados
 * quando implementarmos o fluxo de sessão.
 */
export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
