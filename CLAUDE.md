# CRM Agency — Guia de Arquitetura

> **Instrução para o Claude:** atualize este arquivo sempre que fizer qualquer mudança no projeto — novos endpoints, alterações de schema, dependências, padrões adotados ou pontos de atenção resolvidos/descobertos.

---

## Estrutura de pastas

```
crm-agency/
├── apps/
│   ├── backend/          # API REST + WebSocket (Express + TypeScript)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts         # singleton do PrismaClient
│   │   │   │   ├── rate-limit.ts     # limiters centralizados (global, write, auth)
│   │   │   │   └── schemas.ts        # schemas Zod de validação
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts    # JWT para ADMIN/ATTENDANT
│   │   │   │   └── client.middleware.ts  # JWT exclusivo para CLIENT
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # login e cadastro do primeiro admin
│   │   │   │   ├── client/         # auto-cadastro e login do cliente + tickets próprios
│   │   │   │   ├── clients/        # gestão de clientes (admin/atendente)
│   │   │   │   ├── metrics/        # métricas do dashboard
│   │   │   │   ├── tickets/        # gestão de tickets (admin/atendente)
│   │   │   │   └── users/          # gestão de usuários internos
│   │   │   ├── swagger/
│   │   │   │   ├── openapi.yaml
│   │   │   │   └── swagger.setup.ts
│   │   │   └── server.ts           # entry point: Express + Socket.IO
│   │   ├── tests/
│   │   │   └── test-socket.js      # script manual para testar WebSocket
│   │   ├── prisma.config.ts        # excluído do tsconfig (fora do rootDir)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/         # Next.js 16 (App Router) — em desenvolvimento inicial
│       └── src/
│           ├── app/
│           │   ├── layout.tsx        # root layout — envolve com <Providers>
│           │   ├── providers.tsx     # client component que monta o AuthProvider
│           │   └── page.tsx
│           ├── proxy.ts              # proteção de rotas e redirect por role (Next.js 16)
│           ├── lib/
│           │   ├── api.ts          # helper fetch com injeção de Bearer token (lê do cookie)
│           │   └── cookies.ts      # utilitários getCookie / setCookie / deleteCookie
│           ├── contexts/
│           │   └── AuthContext.tsx   # estado global de autenticação
│           ├── hooks/
│           │   └── useAuth.ts        # hook para consumir o AuthContext
│           └── services/           # (vazio por enquanto)
└── package.json          # raiz sem workspaces configurados
```

Cada módulo do backend segue o padrão: `routes → controller → service → prisma`.

---

## Fluxo de autenticação

Existem **dois fluxos paralelos e separados**, cada um com seu próprio middleware e payload de JWT.

### Fluxo 1 — Admin / Atendente (`/auth/*`)

```
POST /auth/register   [rate limit: 10 req / 15 min]
  └─ Só cria se não existir nenhum usuário (primeiro admin)
  └─ bcrypt hash da senha

POST /auth/login      [rate limit: 10 req / 15 min]
  └─ Busca user por email
  └─ Verifica user.active — lança erro se conta estiver desativada
  └─ Compara senha com bcrypt
  └─ jwt.sign({ userId, role })  → expira em 7 dias
  └─ Retorna { token, user }

POST /auth/logout
  └─ Sem estado no servidor — retorna 200
  └─ O cliente deve descartar o token localmente
```

O `authMiddleware` lê o `Authorization: Bearer <token>`, verifica o JWT, rejeita `role === "CLIENT"` e **consulta o banco para checar `user.active`** — tokens de contas desativadas retornam 403.

### Fluxo 2 — Cliente final (`/client/*`)

```
POST /client/register   [rate limit: 10 req / 15 min]
  └─ Cria User(role=CLIENT) + Client profile em uma transação

POST /client/login      [rate limit: 10 req / 15 min]
  └─ Busca user por email
  └─ Verifica user.active — lança erro se conta estiver desativada
  └─ jwt.sign({ userId, clientId, role: "CLIENT" })  → expira em 7 dias
  └─ Retorna { token, user }

POST /client/logout
  └─ Sem estado no servidor — retorna 200
  └─ O cliente deve descartar o token localmente
```

O `clientMiddleware` só aceita tokens onde `role === "CLIENT"` e **consulta o banco para checar `user.active`** antes de prosseguir.

### Autenticação no WebSocket (Socket.IO)

```
socket.handshake.auth.token  →  jwt.verify  →  socket.data.user
```

Aceita os três roles. O CLIENT tem validação adicional de propriedade do ticket nos eventos `join_ticket` e `send_message`.

### Frontend

O token é armazenado em `localStorage` e injetado automaticamente pelo helper `apiFetch` em `src/lib/api.ts`.

---

## Fluxo de dados

### HTTP

```
Request
  → globalLimiter (200 req / 15 min por IP)
  → Route (Express Router)
  → writeLimiter em POST/PUT/PATCH/DELETE (30 req / 15 min por IP)
  → Middleware (authMiddleware ou clientMiddleware)
  → Controller (valida body com Zod, chama service)
  → Service (lógica de negócio, acessa Prisma)
  → Prisma ORM
  → PostgreSQL
  → Response
```

Services são **classes estáticas** sem injeção de dependência. Zod valida na camada do controller antes de chegar ao service.

### WebSocket (chat em tempo real)

```
Cliente conecta com token JWT
  → Middleware do Socket.IO autentica
  → join_ticket  → socket entra na room "ticket:<id>"
  → send_message → persiste no banco via Prisma
                 → io.to("ticket:<id>").emit("receive_message")
  → typing / stop_typing → broadcast para outros na room
```

---

## Modelos do banco (Prisma / PostgreSQL)

| Model      | Descrição                                                          |
|------------|--------------------------------------------------------------------|
| `User`     | Usuários do sistema. `role`: ADMIN, ATTENDANT, CLIENT              |
| `Client`   | Perfil de cliente. 1:1 com User(CLIENT). Pode ter atendente fixo   |
| `Ticket`   | Chamado. Pertence a Client. Status e prioridade gerenciáveis       |
| `Message`  | Mensagem de chat dentro de um Ticket                               |
| `Settings` | Configurações globais da empresa (nome, logo, cor)                 |

**Enums:**
- `Role`: ADMIN | ATTENDANT | CLIENT
- `TicketStatus`: NEW | IN_PROGRESS | WAITING_CLIENT | DONE
- `TicketPriority`: LOW | MEDIUM | HIGH
- `ClientStatus`: NEW | ACTIVE | INACTIVE — aplicado ao campo `status` de `Client`

---

## Endpoints da API

| Método | Rota                            | Auth                | Rate limit   | Descrição                                          |
|--------|---------------------------------|---------------------|--------------|----------------------------------------------------|
| POST   | `/auth/register`                | público             | authLimiter  | Cadastra o primeiro admin                          |
| POST   | `/auth/login`                   | público             | authLimiter  | Login admin/atendente → JWT                        |
| POST   | `/auth/logout`                  | público             | global       | Sinaliza logout (stateless)                        |
| POST   | `/users`                        | authMiddleware      | writeLimiter | Cria usuário interno                               |
| GET    | `/users`                        | authMiddleware      | global       | Lista usuários                                     |
| PUT    | `/users/:id`                    | authMiddleware      | writeLimiter | Atualiza usuário                                   |
| PATCH  | `/users/:id/deactivate`         | authMiddleware      | writeLimiter | Desativa usuário                                   |
| POST   | `/clients`                      | authMiddleware      | writeLimiter | Cria cliente (validado por Zod)                    |
| GET    | `/clients`                      | authMiddleware      | global       | Lista clientes — filtros: `search`, `status`       |
| GET    | `/clients/:id`                  | authMiddleware      | global       | Busca cliente                                      |
| PUT    | `/clients/:id`                  | authMiddleware      | writeLimiter | Atualiza cliente                                   |
| PATCH  | `/clients/:id/status`           | authMiddleware      | writeLimiter | Atualiza status do cliente (NEW/ACTIVE/INACTIVE)   |
| DELETE | `/clients/:id`                  | authMiddleware      | writeLimiter | Remove cliente                                     |
| GET    | `/tickets`                      | authMiddleware      | global       | Lista tickets paginados                            |
| GET    | `/tickets/grouped`              | authMiddleware      | global       | Tickets agrupados por status (Kanban)              |
| PUT    | `/tickets/:id/status`           | authMiddleware      | writeLimiter | Atualiza status                                    |
| PUT    | `/tickets/:id/priority`         | authMiddleware      | writeLimiter | Atualiza prioridade                                |
| PUT    | `/tickets/:id/reassign`         | authMiddleware      | writeLimiter | Reatribui ticket a outro usuário                   |
| GET    | `/tickets/:id/messages`         | authMiddleware      | global       | Histórico de mensagens do ticket                   |
| POST   | `/client/register`              | público             | authLimiter  | Auto-cadastro do cliente                           |
| POST   | `/client/login`                 | público             | authLimiter  | Login do cliente → JWT                             |
| POST   | `/client/logout`                | público             | global       | Sinaliza logout (stateless)                        |
| POST   | `/client/tickets`               | clientMiddleware    | global       | Cliente cria ticket próprio                        |
| GET    | `/client/tickets`               | clientMiddleware    | global       | Cliente lista seus tickets                         |
| GET    | `/client/tickets/:id`           | clientMiddleware    | global       | Cliente busca ticket próprio                       |
| GET    | `/metrics/summary`              | authMiddleware      | global       | Resumo geral de métricas                           |
| GET    | `/metrics/tickets-by-status`    | authMiddleware      | global       | Contagem por status                                |
| GET    | `/metrics/tickets-by-priority`  | authMiddleware      | global       | Contagem por prioridade                            |
| GET    | `/metrics/clients-by-attendant` | authMiddleware      | global       | Clientes por atendente                             |

Documentação Swagger disponível em `http://localhost:4000/docs`.

---

## Rate limiting

Todos os limiters ficam em `src/lib/rate-limit.ts` e são importados pelos módulos que precisam.

| Limiter        | Janela   | Máx req | Aplicado em                                        |
|----------------|----------|---------|----------------------------------------------------|
| `globalLimiter`| 15 min   | 200     | Todas as rotas (`app.use` em `server.ts`)           |
| `writeLimiter` | 15 min   | 30      | POST, PUT, PATCH, DELETE de users/clients/tickets  |
| `authLimiter`  | 15 min   | 10      | `/auth/register`, `/auth/login`, `/client/register`, `/client/login` |

---

## Principais dependências

### Backend

| Pacote               | Uso                                                      |
|----------------------|----------------------------------------------------------|
| `express` ^5         | Framework HTTP                                           |
| `@prisma/client` ^7  | ORM / acesso ao PostgreSQL                               |
| `socket.io` ^4       | WebSocket para chat em tempo real                        |
| `jsonwebtoken` ^9    | Geração e verificação de JWT                             |
| `bcrypt` ^6          | Hash de senhas                                           |
| `zod` ^4             | Validação de inputs                                      |
| `express-rate-limit` | Rate limiting (global + por rota)                        |
| `swagger-ui-express` | Documentação interativa da API                           |
| `ts-node-dev`        | Hot reload em desenvolvimento (devDependency)            |
| `socket.io-client`   | Usado apenas em `tests/test-socket.js` (devDependency)   |

### Frontend

| Pacote          | Uso                                        |
|-----------------|--------------------------------------------|
| `next` 16       | Framework React (App Router)               |
| `react` 19      | UI                                         |
| `tailwindcss` 4 | Estilo                                     |

---

## Comandos

```bash
# Backend
cd apps/backend
npm run dev               # ts-node-dev com hot reload (porta 4000)

# Frontend
cd apps/frontend
npm run dev               # Next.js dev server (porta 3000)

# Prisma
cd apps/backend
npx prisma migrate dev    # cria migration e aplica
npx prisma generate       # regenera o client após mudança de schema
npx prisma studio         # GUI do banco
```

Variáveis de ambiente necessárias em `apps/backend/.env`:
```
DATABASE_URL=
JWT_SECRET=
PORT=4000
FRONTEND_URL=http://localhost:3000
```

---

## Plano do Frontend

O frontend está em estado de scaffold (somente `page.tsx` e `layout.tsx`). Este plano descreve o que precisa ser construído, na ordem recomendada de execução.

---

### Estrutura de rotas (App Router)

```
src/app/
├── proxy.ts                          # Proteção de rotas e redirecionamento por role (Next.js 16)
├── (public)/                         # Rotas sem autenticação
│   ├── login/page.tsx                # Login admin/atendente
│   └── portal/
│       ├── login/page.tsx            # Login cliente
│       └── register/page.tsx         # Cadastro cliente
├── (dashboard)/                      # Rotas protegidas — ADMIN e ATTENDANT
│   ├── layout.tsx                    # Sidebar + header + auth guard
│   ├── dashboard/page.tsx            # Cards de métricas
│   ├── tickets/
│   │   ├── page.tsx                  # Kanban board (agrupado por status)
│   │   └── [id]/page.tsx             # Detalhe do ticket + chat
│   ├── clients/
│   │   ├── page.tsx                  # Lista paginada com search e filtro de status
│   │   └── [id]/page.tsx             # Detalhe do cliente + tickets vinculados
│   └── users/page.tsx                # Gestão de usuários — somente ADMIN
└── (portal)/                         # Rotas protegidas — CLIENT
    ├── layout.tsx                    # Layout minimalista + auth guard
    ├── portal/tickets/page.tsx       # Lista dos tickets do cliente
    ├── portal/tickets/new/page.tsx   # Criar ticket
    └── portal/tickets/[id]/page.tsx  # Detalhe do ticket + chat
```

---

### Componentes planejados

```
src/components/
├── ui/                     # Primitivos reutilizáveis (Button, Input, Badge, Modal, etc.)
├── layout/
│   ├── Sidebar.tsx         # Navegação lateral (links variam por role)
│   └── Header.tsx          # Barra superior com nome do usuário e logout
├── auth/
│   └── AuthGuard.tsx       # Verifica token e role, redireciona se inválido
├── dashboard/
│   └── MetricCard.tsx      # Card individual de métrica (número + label)
├── tickets/
│   ├── KanbanBoard.tsx     # Grid de colunas por status com drag-and-drop
│   ├── KanbanColumn.tsx    # Coluna individual (NEW, IN_PROGRESS, etc.)
│   ├── TicketCard.tsx      # Card arrastável com título, prioridade, cliente
│   └── TicketChat.tsx      # Chat em tempo real via Socket.IO
├── clients/
│   ├── ClientTable.tsx     # Tabela paginada com search e filtro de status
│   └── ClientStatusBadge.tsx
└── users/
    └── UserTable.tsx       # Tabela com ações de atualizar e desativar
```

---

### Estado e dados

| Camada | Solução | Motivo |
|--------|---------|--------|
| Auth state (token, user, role) | React Context + `useReducer` | Simples o suficiente; sem dependência externa |
| Data fetching e cache | SWR | Revalidação automática, deduplication, loading states fáceis |
| Formulários | `react-hook-form` + `zod` | Validação client-side em sync com os schemas do backend |
| Socket.IO | hook customizado `useTicketChat` | Encapsula conexão, join/leave e eventos de mensagem |

---

### Middleware Next.js (proteção de rotas)

O `middleware.ts` precisa ler o token de um **cookie** (não de `localStorage`, que é inacessível no servidor). Isso implica:

1. No login, salvar o JWT em um cookie `httpOnly` além (ou no lugar) do `localStorage`
2. O middleware lê o cookie, decodifica o payload sem verificar a assinatura (apenas para ler o `role`) e redireciona:
   - Sem token → `/login`
   - `role === CLIENT` tentando acessar `/dashboard/*` → `/portal/tickets`
   - `role !== CLIENT` tentando acessar `/portal/*` → `/dashboard`

---

### Dependências a instalar no frontend

```bash
# Dados e formulários
npm install swr react-hook-form zod

# WebSocket
npm install socket.io-client

# Drag-and-drop para o Kanban
npm install @dnd-kit/core @dnd-kit/sortable

# Gráficos nas métricas
npm install recharts
```

---

### Variáveis de ambiente

Adicionar em `apps/frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

### Ordem de desenvolvimento recomendada

| Etapa | O que construir | Status | Dependências |
|-------|-----------------|--------|--------------|
| 1 | Auth Context + hook `useAuth` + `apiFetch` migrado para cookie | ✅ feito | — |
| 2 | Middleware Next.js + redirect por role | ✅ feito | Etapa 1 |
| 3 | Layouts (dashboard e portal) com Sidebar e Header | ✅ feito | Etapa 2 |
| 4 | Páginas de login (admin e cliente) e cadastro de cliente | — | Etapa 3 |
| 5 | Dashboard de métricas (`GET /metrics/summary`) | — | Etapa 3 |
| 6 | Kanban de tickets (`GET /tickets/grouped`, drag-and-drop) | — | Etapa 3 |
| 7 | Detalhe do ticket + chat em tempo real (Socket.IO) | — | Etapa 6 |
| 8 | Lista e detalhe de clientes (paginação, filtro, criação) | — | Etapa 3 |
| 9 | Portal do cliente (listar/criar tickets + chat) | — | Etapa 7 |
| 10 | Gestão de usuários (somente ADMIN) | — | Etapa 3 |

---

## Pontos de atenção

### Arquitetura

1. **Monorepo sem workspaces** — o `package.json` raiz não configura `workspaces`. Os dois apps são independentes sem compartilhamento de tipos ou utilitários.

### Frontend

2. **Token em cookie regular (não httpOnly)** — o token está em um cookie `SameSite=Strict`, o que já é mais seguro que localStorage para CSRF. Para proteção total contra XSS, a etapa seguinte seria um endpoint Next.js API que recebe o JWT do backend e o grava em cookie `httpOnly`, inacessível a JavaScript.
