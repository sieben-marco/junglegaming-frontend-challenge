/**
 * Contratos genéricos compartilhados pelas respostas REST do Kurio.
 *
 * Estes tipos são o "idioma" comum entre o transporte (Axios/MSW), o estado
 * (TanStack Query) e a interface (componentes). Documentados em ARCHITECTURE.md.
 */

/** Corpo padrão de erro de qualquer endpoint. */
export interface ApiErrorBody {
  /** Código HTTP associado. */
  status: number;
  /** Código de negócio legível por máquina (ex.: 'NFT_NOT_FOUND'). */
  code: string;
  /** Mensagem legível por humanos (pode ser exibida na interface). */
  message: string;
  /** Erros por campo (validação de formulário), quando aplicável. */
  details?: Record<string, string>;
}

/** Metadados de paginação de uma listagem. */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
