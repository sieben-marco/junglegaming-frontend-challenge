# ARCHITECTURE.md — Kurio (NFT Marketplace)

> Documento vivo. Registra contratos, decisões e desvios do Figma, como a
> entrega exige. Mantenha **enxuto** (é carregado como instrução em toda sessão).

## 1. Visão geral

Marketplace de NFTs em **React 19 + TypeScript + Vite**. Toda a integração é
simulada na camada de rede (**MSW**), de modo que a aplicação fala **REST** e
**Socket.IO** como falaria com um backend real. Nada de dado fictício dentro de
componentes/hooks.

## 2. Stack

React · TypeScript (**estrito**: `strict: true`) · TanStack Router (file-based)
· TanStack Query · Axios · MSW (+ `@mswjs/socket.io-binding`) · Socket.IO client
· Tailwind CSS v4 · shadcn/ui (Base UI) · **zod** (validação) ·
Playwright/Lighthouse (a instalar).

## 3. Estrutura de pastas

```
src/
  routes/                 rotas TanStack (file-based) + routeTree.gen.ts
  components/
    ui/                   shadcn/ui
    layout/               header, footer, newsletter band
    common/               Shimmer, PagePlaceholder
  features/<dominio>/     api, queries, search-params, components, format
  lib/                    http (Axios), query-client, socket, api-error
  mocks/                  handlers/, fixtures/, scenarios.ts, browser.ts, index.ts
  types/                  contratos (DTOs) entre transporte, estado e UI
```

## 4. Contratos REST

Erro padrão (`types/api.ts`): `{ status, code, message, details? }`.
Dinheiro: **ETH como string decimal**; quantidades inteiras.

### `GET /api/nfts` — listagem (IMPLEMENTADO)
Query: `q`, `tab` (`all|new|trending`), `collections` (csv), `networks` (csv),
`priceMin`, `priceMax`, `sort` (`recent|price-asc|price-desc|name-asc`),
`page`, `pageSize`.

Resposta (`NftListResponse`): `items: Nft[]`, `page`, `pageSize`, `total`,
`totalPages`, `facets` (`collections`/`networks` com `count`), `priceRange`.

### `GET /api/nfts/:id` — detalhe (IMPLEMENTADO)
200 com `Nft`; 404 com `code: "NFT_NOT_FOUND"`.

### Planejados
Sessão/conta (cadastro, login, sessão, logout, expiração), Favoritos, Carrinho,
Cotação (cupom/disponibilidade/taxas/total), Pedidos (criação **idempotente**),
Perfil, Carteiras. Requisitos canônicos: `challenge-description/README.md` §5.

## 5. Estado na URL (catálogo)

Busca/filtros/ordenação/página vivem nos **search params** das rotas `/` e
`/mercado` (schema zod `catalogSearchSchema`) — sobrevivem a refresh e histórico.
`toNftListParams()` traduz o estado "bonito" da URL para a query string da API.
`stripSearchParams` remove os valores padrão da URL.

## 6. TanStack Query — política de cache

`src/lib/query-client.ts`: `staleTime` 30 s, `gcTime` 5 min, `retry: 1` em
queries e `retry: 0` em mutations (não duplicar operação). `refetchOnWindowFocus`
desligado. Listagem usa `placeholderData: keepPreviousData` (evita "piscar" ao
paginar/filtrar) e expõe `isPlaceholderData` para a UI indicar atualização.

Chaves: `catalogKeys.list(search)` / `catalogKeys.detail(id)` — isolamento por
parâmetros da consulta (e, na etapa de sessão, por usuário).

## 7. MSW — estratégia de mocking

- Handlers em `src/mocks/handlers/` (por domínio), combinados em `index.ts`.
- Fixtures determinísticas (`fixtures/nfts.ts`, RNG com semente fixa) ⇒ testes
  estáveis e reset para cenário conhecido.
- Cenários configuráveis (`scenarios.ts`): `catalogLatencyMs`, `catalogFailure`,
  `catalogEmpty`. Só os mocks leem esse módulo. `resetMockScenarios()` restaura.
- Ativação por configuração: `enableMocking()` liga em DEV e no build de
  demonstração (`VITE_ENABLE_MOCKS="true"`); `onUnhandledRequest: 'bypass'`.
- **Limitação de transporte (Socket.IO):** o MSW intercepta **WebSocket**, então
  o client força `transports: ['websocket']`. Documentar/preservar isso na etapa
  de tempo real.

## 8. Tempo real (planejado)

Eventos `nft.updated` (preço/disponibilidade) e `order.updated` (estado do
pedido), com identidade estável + versão; tolerância a duplicatas/eventos
antigos; reconciliação com REST após reconexão.

## 9. Acessibilidade

`aria-busy` em regiões que atualizam; `aria-live="polite"` para contagem de
resultados; `role="img"` + `aria-label` nas artes; ações de card
com foco (`group-focus-within`); controles com `label`/`aria-label`; foco visível
(`focus-visible:ring`). Skeletons respeitam `prefers-reduced-motion`.

## 10. Desvios do Figma / limitações conhecidas

- **Artes dos NFTs:** 4 artes fornecidas pelo dev em `public/nfts/`
  (`nft-artwork-03/04/05/11.png`, nomes espelhando o original "NFT Artwork NN")
  reutilizadas ciclicamente entre os 36 NFTs. Há menos artes que itens; o
  placeholder determinístico fica como fallback. Quando o dev enviar mais,
  é só adicionar os arquivos e atualizar `NFT_ARTWORKS` (fixtures).
- **Filtro de preço:** dois sliders nativos empilhados (fidelidade funcional)
  em vez do slider de dois "polegares" do Figma.
- **Contagens das facetas:** derivadas das fixtures (dataset menor que o Figma),
  por consistência entre filtros e lista.
- **Fonte:** mantemos Geist (starter); confirmar a fonte do Figma depois.
- **Busca:** campo no topo dos resultados (o Figma sugere ícone no header).

## 11. Comandos

`npm run dev` (com mocks) · `npm run build` (`tsc -b && vite build`) ·
`npm run preview` · `npm run lint` · `npm run format`.
Faltam: typecheck dedicado, Playwright, Lighthouse (próximas etapas).
