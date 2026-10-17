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
    common/               Shimmer, PagePlaceholder, QuantityStepper, RatingStars
  features/<dominio>/     api, queries, components, schemas, regras puras
  lib/                    http (Axios), query-client, socket, api-error, eth, cart-totals
  mocks/                  handlers/, fixtures/, db.ts, session.ts, scenarios.ts, browser.ts
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
200 com `Nft` (inclui `editions[]`, `tokenId`, `attributes`, `rating`,
`contractAddress`, `royaltiesPercent`); 404 com `code: "NFT_NOT_FOUND"`.

### `GET /api/nfts/:id/reviews` — avaliações (IMPLEMENTADO)
200 com `{ items, average, count }`. A média/nº saem das próprias avaliações.

### Carrinho (IMPLEMENTADO) — `types/cart.ts`
| Método | Rota | Observações |
| --- | --- | --- |
| GET | `/api/cart` | `Cart`: `items[]`, `coupon`, `totals`, `updatedAt` |
| POST | `/api/cart/items` | corpo `{ nftId, editionId, quantity }`; **merge** se já existir |
| PATCH | `/api/cart/items/:itemId` | `:itemId` = `nftId:editionId`; corpo `{ quantity }` |
| DELETE | `/api/cart/items/:itemId` | remove a linha |
| POST | `/api/cart/coupon` | corpo `{ code }` |
| DELETE | `/api/cart/coupon` | remove o cupom |

Todo mutation devolve o **`Cart` completo** (fonte da verdade dos valores).
Códigos: 404 `NFT_NOT_FOUND`/`EDITION_NOT_FOUND`/`CART_ITEM_NOT_FOUND`;
409 `OUT_OF_STOCK`; 422 `VALIDATION_ERROR`/`QUANTITY_LIMIT`/`COUPON_INVALID`/
`COUPON_EXPIRED`; 503 `CART_UNAVAILABLE` (cenário de falha).
Regras: `limite por pedido = min(disponível, maxPerOrder)`; taxa de rede fixa
(0.016 ETH, zerada com carrinho vazio); cupons de fixture (`KURIO10`, `KURIO25`,
`EXPIRADO10`).

### Favoritos (IMPLEMENTADO) — `types/favorite.ts`
`GET`/`POST`/`DELETE /api/favorites[/:nftId]` ⇒ `{ nftIds }`. **Exigem sessão**;
sem login respondem **401 `UNAUTHENTICATED`** e a UI encaminha para `/entrar`
(com `redirect`). Ficam isolados por usuário em `db.favorites[userId]`.

### Sessão e conta (IMPLEMENTADO — login)
| Método | Rota | Observações |
| --- | --- | --- |
| POST | `/api/auth/login` | corpo `{ email, password }` ⇒ `{ user, token }`; 401 `INVALID_CREDENTIALS` (mesma resposta para e-mail inexistente e senha errada); 422 `VALIDATION_ERROR`. **Mescla o carrinho do visitante** no do usuário. |
| GET | `/api/auth/session` | exige `Authorization: Bearer <token>`; ⇒ `{ user }`; 401 `UNAUTHENTICATED` / `SESSION_EXPIRED`. É o que **recupera a sessão após refresh**. |

O token é criado pelo "servidor" (`db.createSession`, TTL de 2 h), guardado pelo
cliente (`lib/auth-token.ts`) e reenviado pelo interceptor do Axios. A identidade
das rotas privadas vem do cabeçalho (`session.getCurrentUserId(request)`), o que
mantém carrinho e favoritos **isolados por usuário**.
Contas de demonstração (fictícias, senha nunca em claro — só um digest):
`ana@kurio.art` / `kurio123` e `bruno@kurio.art` / `kurio123`
(`mocks/fixtures/users.ts`).

### Planejados
Cadastro de conta (conflito de e-mail), logout, Perfil, Carteiras,
Cotação de checkout, Pedidos (criação **idempotente**). Requisitos canônicos:
`challenge-description/README.md` §5.

## 5. Estado na URL (catálogo)

Busca/filtros/ordenação/página vivem nos **search params** das rotas `/` e
`/mercado` (schema zod `catalogSearchSchema`) — sobrevivem a refresh e histórico.
`toNftListParams()` traduz o estado "bonito" da URL para a query string da API.
`stripSearchParams` remove os valores padrão da URL.

**Carrinho e favoritos NÃO vivem na URL:** são recursos do "servidor" (estado em
`mocks/db.ts`, persistido). A rota `/entrar` aceita `redirect` para retomar o
fluxo anterior.

## 6. TanStack Query — política de cache

`src/lib/query-client.ts`: `staleTime` 30 s, `gcTime` 5 min, `retry: 1` em
queries e `retry: 0` em mutations (não duplicar operação). `refetchOnWindowFocus`
desligado. Listagem usa `placeholderData: keepPreviousData` (evita "piscar" ao
paginar/filtrar) e expõe `isPlaceholderData` para a UI indicar atualização.

Chaves: `catalogKeys.list(search)` / `catalogKeys.detail(id)` /
`catalogKeys.related(input)`; `cartKeys.detail()`; `favoritesKeys.list()`;
`authKeys.session()`. Isolamento por parâmetros da consulta e por **sessão**: o
carrinho e os favoritos são do usuário do token (no "servidor"), e a UI decide
"quem sou eu" com `useCurrentUser()` (token + `GET /auth/session`).

**Sessão e troca de estado:** `useAuthToken()` lê o token como estado EXTERNO
(`useSyncExternalStore` sobre `lib/auth-token.ts`). Quando o token muda (login,
logout ou um 401 que o interceptor descartou), a sessão é invalidada e a UI volta
sozinha ao estado de visitante. Após o login: `setQueryData` da sessão +
invalidação de `cartKeys.all` (o "servidor" mesclou o carrinho do visitante) e
`favoritesKeys.all` (agora existem de verdade). O layout raiz (`__root.tsx`)
monta `useSessionBootstrap()` UMA vez: é ele que faz a sessão ser recuperada ao
abrir/recarregar QUALQUER tela (sem isso, a recuperação dependeria de a tela
por acaso ler a sessão).

**Atualização otimista (`cart/queries.ts`, `favorites/queries.ts`):** padrão
`onMutate` (snapshot + escrita do estado previsto) → `onError` (**rollback** para
o snapshot) → `onSettled` (invalidate/revalidação para reconciliar com o
servidor). O estado previsto do carrinho reusa a MESMA função de totais do
servidor (`lib/cart-totals.ts`), evitando divergência. Cupom não é otimista
(quem define percentual é o servidor).

**Eventos de tempo real** (`features/cart/realtime.ts` via listener do §8) não são
"otimistas": o dado é autoritativo, então escrevem o valor previsto no cache
(`setQueryData`) e **não** há rollback — se o REST discordar, um refetch corrige.

## 7. MSW — estratégia de mocking

- Handlers em `src/mocks/handlers/` (por domínio), combinados em `index.ts`.
- **Banco stateful** (`db.ts`): o MSW é o "servidor". Guarda carrinho (por
  escopo) e favoritos (por usuário) e **espelha em `localStorage`**
  (`kurio:mock-db`, com versão) ⇒ o carrinho **sobrevive ao refresh**.
  `mutateDb()` persiste; `resetMockDb()` restaura o cenário conhecido.
- **Sessão simulada** (`session.ts`): o usuário da requisição é resolvido pelo
  token (`Authorization: Bearer`), contra as sessões abertas no banco (`users` +
  `sessions`, persistidos). Sem token/validade ⇒ as rotas privadas respondem 401
  e a UI encaminha para `/entrar` (com `redirect`). `expireSessions()` (dev tool)
  força a expiração sem mexer no cliente.
- Fixtures determinísticas (`fixtures/nfts.ts`, `fixtures/coupons.ts`, RNG com
  semente fixa) ⇒ testes estáveis e reset para cenário conhecido.
- Cenários configuráveis (`scenarios.ts`): `catalogLatencyMs`, `catalogFailure`,
  `catalogEmpty`, `cartLatencyMs`, `cartMutationFailure`, `networkError`.
  Só os mocks leem esse módulo. `resetMockScenarios()` restaura.
- `HttpResponse.error()` simula falha de REDE (sem resposta) e é usado quando
  `networkError` está ligado.
- Ativação por configuração: `enableMocking()` liga em DEV e no build de
  demonstração (`VITE_ENABLE_MOCKS="true"`); `onUnhandledRequest: 'bypass'`.
- **Limitação de transporte (Socket.IO):** o MSW intercepta **WebSocket**, então
  o client força `transports: ['websocket']` (o padrão do Socket.IO começa em
  "polling" HTTP) e **carrega o `socket.io-client` por import dinâmico**
  (`lib/socket.ts`): o `engine.io-client` guarda `globalThis.WebSocket` numa
  constante ao ser avaliado, e precisa enxergar o WebSocket já interceptado.
  Ver §8.

## 8. Tempo real (Socket.IO)

**Implementado: `nft.updated` (preço) — catálogo, detalhe e CARRINHO — e a
RECONCILIAÇÃO com o REST quando a conexão volta.** Pendente: `order.updated`
(depende do checkout); mudança de disponibilidade (junto do cenário de estoque).

- **Contrato** (`types/realtime.ts`): `{ resource: 'nft', id, version, priceEth,
  updatedAt }` — identidade estável, recurso afetado e **versão monotônica por
  recurso**.
- **Servidor simulado** (`mocks/realtime.ts`): `ws.link('/')` + `toSocketIo`
  (`@mswjs/socket.io-binding`) traduz o protocolo (engine.io/socket.io-parser) e
  emite o handshake automaticamente. O "servidor" guarda as conexões abertas e
  transmite por elas (o binding não implementa rooms/broadcast). `changeNftPrice`
  altera o preço no "banco" (`db.nftPatches`) **e** emite o evento — REST e
  socket contam a mesma história (`mocks/nft-state.ts` é a única fonte que os
  handlers REST leem).
- **Cliente** (`features/realtime/use-nft-updates.ts`, montado 1× no
  `__root.tsx`): mantém a última versão aplicada por NFT e **ignora duplicatas e
  eventos antigos** (`version <= aplicada`); aplica o dado no cache
  (`setQueryData` do detalhe + `setQueriesData` das listagens/carrosséis) sem
  refetch. REST continua sendo a verdade: um refetch devolve o mesmo valor.
- **Carrinho** (`features/cart/realtime.ts`): `applyNftPriceToCart` aplica o mesmo
  evento na chave `cartKeys.detail()` quando o NFT é uma linha — troca
  `unitPriceEth`, refaz `lineTotalEth` e o resumo com as **mesmas funções puras do
  "servidor"** (`lib/eth` + `lib/cart-totals` via `withRecalculatedTotals`), sem
  fórmula paralela. Devolve o MESMO objeto quando nada mudou (sem re-render
  inútil). `unitPriceWhenAddedEth` é preservado de propósito: é a divergência
  entre ele e o preço atual que faz a linha avisar "Preço atualizado para …".
- **Reconciliação** (`reconcileWithServer` no mesmo arquivo): `connect` dispara na
  primeira conexão e em cada reconexão; só da SEGUNDA em diante o app invalida
  `catalogKeys.all` + `cartKeys.all`. MOTIVO: durante a queda o "servidor" seguiu
  mudando e esses eventos se perderam — a API é quem reconta a história. Aqui
  `invalidateQueries` (e não `setQueryData`) é o certo: não sabemos O QUE mudou.
- **Gatilhos em DEV** (`mocks/dev-tools.ts` → `window.__kurioMocks`):
  `changeNftPrice` (ação do servidor), `emitNftUpdate` (reentrega um evento, para
  duplicata/fora de ordem), `connectedClientCount` (o teste espera o socket
  conectar sem `waitForTimeout`) e `disconnectClients` (**derruba** as conexões,
  para o cenário de queda/reconexão).
- **Detalhes do MSW que exigiram cuidado** (ver AGENTS.md §9): (1) ao casar a
  URL, o MSW remove a query e normaliza o caminho `/socket.io/` para `/`, logo o
  padrão do `ws.link` é `'/'` (e o handler dá passthrough em quem não é
  Socket.IO, ex.: o HMR do Vite); (2) o `path-to-regexp` desta versão **não
  aceita RegExp**, então nada de `ws.link(/.../)`; (3) `connection.client.socket`
  (fora do protocolo público) fornece o `readyState` usado para descartar
  conexões mortas.

As chaves já estavam preparadas: invalidar `['catalog']` atualiza catálogo,
detalhe e avaliações; `cartKeys` expõe `updatedAt` e o carrinho detecta mudança
de preço (`unitPriceWhenAddedEth`).

## 9. Acessibilidade

`aria-busy` em regiões que atualizam; `aria-live="polite"` para contagem de
resultados, valor do stepper e resumo do carrinho (troca de cupom/quantidade);
`role="img"` + `aria-label` nas artes; ações de card com foco
(`group-focus-within`); controles com `label`/`aria-label`; foco visível
(`focus-visible:ring`). Skeletons respeitam `prefers-reduced-motion`.

Novos: `QuantityStepper` (grupo rotulado + `<output aria-live>` + botões
"Diminuir/Aumentar …"); abas com `role=tablist` (Base UI) e navegação por setas;
`RatingStars` com texto alternativo (nota média) em vez de "★★★★☆"; carrossel com
`aria-label`, setas rotuladas e pontos com `aria-current`; barra fixa do mobile
com rótulos e `aria-label` no carrinho; **região viva sempre montada no carrinho**
(`role="status"` sr-only) que anuncia "Preço atualizado em N item(ns) do
carrinho." quando o tempo real remarca uma linha — o `aria-live` do resumo diz que
os valores mudaram, esta região diz **por quê**.

**Login:** é um diálogo de verdade (Base UI): foco preso enquanto aberto, `Esc` e
X para fechar, foco devolvido a quem abriu, `role="dialog"` com nome acessível
(o título "Entrar" é o `DialogTitle`). Os campos usam `aria-label` (o Figma não
mostra rótulo), e cada erro de campo aparece em `<p>` ligado por
`aria-describedby` + `aria-invalid`; o erro do servidor vai numa região
`role="alert"`. O botão do "olho" é rotulado ("Mostrar/Ocultar senha") e o envio
com teclado funciona sem rato.

**Sem controles duplicados:** no mobile a quantidade/compra vivem SÓ na barra
fixa e o favorito é um coração sobre a imagem (o painel fica `hidden md:block`).
Antes havia dois grupos `aria-label="Quantidade de …"` na mesma tela.

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
- **Galeria do detalhe:** o Figma mostra 4 thumbnails; como há **uma arte por
  NFT**, a coluna de miniaturas só aparece se o NFT tiver mais de uma imagem. A
  lupa abre um dialog com a imagem ampliada.
- **Edições:** o mobile do Figma lista "1/10" duas vezes (provável erro do
  mockup); usamos o conjunto do desktop (`1/1`, `1/10`, `1/50`, `ABERTA`) e cada
  NFT oferece um subconjunto delas.
- **Taxa de rede:** valor fixo de 0.016 ETH por carrinho (o Figma mostra esse
  valor); zerada quando o carrinho está vazio. Cupons são fictícios
  (`KURIO10`/`KURIO25`/`EXPIRADO10`).
- **Ícones de marca:** `lucide-react` não os tem mais; o compartilhamento usa
  ícones genéricos com `aria-label`, apontando para intents reais.
- **"Conectar e finalizar":** leva ao login (o checkout é a próxima etapa) — não
  simulamos sucesso de compra.
- **Mobile do detalhe:** os controles de compra ficam na barra fixa (com o
  "Comprar NFT") e o favorito vira um coração sobre a imagem; o painel mantém só
  edição e metadados, como no mockup. O botão "voltar" flutuante do Figma não foi
  implementado (há breadcrumb + histórico do navegador).
- **Interface de dev:** em DEV, `window.__kurioMocks` expõe troca de cenários e
  reset do banco; os devtools do TanStack podem ser desligados com
  `VITE_DISABLE_DEVTOOLS="true"` (usado nos testes E2E, pois flutuavam sobre a
  barra de compra no mobile).
- **Login (Figma: modal sobre a Home):** entregamos o modal (diálogo com foco
  preso, `Esc` e X para sair) sobre o fundo escurecido, mas **sem renderizar a
  Home por baixo** — a rota `/entrar` é a dona da tela, o que permite abrir o
  login por link direto e retomar o fluxo com `?redirect=`.
- **Login social:** os botões "Continuar com Google/Facebook" existem (o Figma
  os mostra) mas ficam **desabilitados**, com explicação para leitor de tela —
  integrar provedores reais está fora do escopo e um botão que "não faz nada"
  aparentando funcionar seria um fluxo falso. `TODO(asset)`: ícones de marca
  (aguardando o dev). "Esqueceu a senha?" apenas informa que não há recuperação
  nesta demonstração (não simulamos envio de e-mail).
- **Credenciais de demonstração** aparecem como legenda no formulário
  (não existem no Figma): sem cadastro/e-mail real, o avaliador precisa saber
  com que conta entrar.

## 11. Testes E2E (Playwright)

`playwright.config.ts` + `tests/e2e/**`. O Playwright sobe o **próprio** dev
server na porta `5199` (`--strictPort`) — teste não depende de servidor "já
rodando". Como os mocks ligam em DEV, o teste exercita o app como em produção.

- Projetos: `desktop-chromium` (1280×900) e `mobile-chromium` (Pixel 5).
- Valores esperados vêm das **mesmas fixtures** do MSW (`tests/e2e/support/data.ts`
  reusa `lib/eth`/`lib/cart-totals` e `fixtures/nfts`) — nada de número mágico.
- Locators por papel (`getByRole`) e escopo por região; `:visible` quando o layout
  desktop e o mobile renderizam o mesmo conteúdo.
- Cenários de falha (ex.: rollback do otimista) são ligados DENTRO da página via
  `window.__kurioMocks` — a UI não tem "caminho alternativo", quem falha é o
  "servidor".
- **27 fluxos** cobrindo catálogo, detalhe, carrinho, sessão, tempo real e mobile.
- **Sessão:** login (retorno ao fluxo anterior, validação no cliente sem ida à
  rede, credenciais inválidas), **recuperação da sessão pelo token após refresh**
  (o teste exige o 200 de `GET /api/auth/session` numa navegação do zero),
  favorito **salvo de verdade + preservado após refresh**, carrinho do visitante
  mesclado ao entrar e **expiração durante a navegação** (o "servidor" vence a
  sessão no meio do fluxo e o app pede login de novo, retomando o contexto). Com
  a mesclagem desligada no "servidor", o fluxo do carrinho FALHA (conferido).
- **Tempo real sem janela de dúvida:** o fluxo de reconciliação derruba as
  conexões E muda o preço na MESMA ida ao "servidor"
  (`serverDropsConnectionsAndChangesPrice`) — assim não existe o instante em que
  o app está conectado e recebe o evento; o preço novo só pode ter vindo do REST.
  Com a reconciliação desligada, o fluxo FALHA (conferido).
- **Teste que "morde":** antes de disparar um evento de tempo real, o fluxo espera
  o carrinho "sossegar" (`waitForCartFetchToSettle`, nenhum `GET /api/cart` em
  voo). Sem isso, a resposta de uma busca disparada pelo "adicionar" chegava
  DEPOIS do evento já com o preço novo e o teste passava por acaso (ver AGENTS.md
  §9). Com o patch do cliente desligado, o fluxo FALHA — a prova de que ele mede o
  que diz medir.
- Em falha: screenshot, vídeo e `trace`; relatório HTML (`playwright-report`).

## 12. Comandos

`npm run dev` (com mocks) · `npm run build` (`tsc -b && vite build`) ·
`npm run preview` · `npm run lint` · `npm run format` · `npm run test:e2e` ·
`npm run test:e2e:report`.
Faltam: Lighthouse e regressão visual (`toHaveScreenshot`).
