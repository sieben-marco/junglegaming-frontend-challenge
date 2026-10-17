import { http, HttpResponse } from 'msw';

/**
 * Handlers REST do MSW.
 *
 * Esta é a camada de rede simulada. Componentes e hooks NÃO devem conter
 * respostas fictícias: elas vivem aqui. Por enquanto temos apenas um
 * endpoint de saúde para validar a integração; os contratos reais
 * (sessão, NFTs, favoritos, carrinho, cotação, pedidos, perfil, carteiras)
 * serão adicionados na próxima etapa.
 */
export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
];
