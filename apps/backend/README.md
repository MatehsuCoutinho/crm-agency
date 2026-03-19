# Helpdesk Platform API

API REST com chat em tempo real para uma plataforma de suporte ao cliente. Construida com Node.js, TypeScript, Express, PostgreSQL e Socket.IO.

A documentacao interativa completa esta disponivel via Swagger UI em `/docs` apos subir o servidor.

---

## Sumario

- [Visao Geral](#visao-geral)
- [Arquitetura](#arquitetura)
- [Fluxo do Sistema](#fluxo-do-sistema)
- [Tecnologias](#tecnologias)
- [Como Rodar](#como-rodar)
- [Variaveis de Ambiente](#variaveis-de-ambiente)
- [Documentacao Interativa](#documentacao-interativa)
- [Autenticacao](#autenticacao)
- [Referencia da API](#referencia-da-api)
  - [Auth — Staff](#auth--staff)
  - [Auth — Cliente](#auth--cliente)
  - [Usuarios](#usuarios)
  - [Clientes](#clientes)
  - [Tickets — Staff](#tickets--staff)
  - [Tickets — Cliente](#tickets--cliente)
  - [Metricas](#metricas)
- [Chat em Tempo Real](#chat-em-tempo-real)
- [Permissoes por Role](#permissoes-por-role)
- [Seguranca](#seguranca)
- [Tratamento de Erros](#tratamento-de-erros)
- [Testando o Chat](#testando-o-chat)

---

## Visao Geral

A plataforma possui dois mundos completamente separados:

- **Portal do Staff** — usado por admins e atendentes para gerenciar clientes, tickets e metricas
- **Portal do Cliente** — usado pelos clientes finais para se registrar, abrir tickets de suporte e conversar com atendentes em tempo real

Ambos compartilham o mesmo banco de dados mas possuem fluxos de autenticacao independentes. Um token de cliente nao acessa rotas do staff e vice-versa.

---

## Arquitetura

```
src/
├── lib/
│   ├── prisma.ts               # Instancia do Prisma client
│   └── schemas.ts              # Schemas de validacao com Zod
├── middlewares/
│   ├── auth.middleware.ts      # Autenticacao do staff (ADMIN, ATTENDANT)
│   └── client.middleware.ts    # Autenticacao do cliente (CLIENT)
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── auth.routes.ts
│   ├── users/
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── users.routes.ts
│   ├── clients/
│   │   ├── clients.service.ts
│   │   ├── clients.controller.ts
│   │   └── clients.routes.ts
│   ├── tickets/
│   │   ├── tickets.service.ts
│   │   ├── tickets.controller.ts
│   │   └── tickets.routes.ts
│   ├── client/
│   │   ├── client.service.ts
│   │   ├── client.controller.ts
│   │   ├── client-tickets.service.ts
│   │   ├── client-tickets.controller.ts
│   │   └── client.routes.ts
│   └── metrics/
│       ├── metrics.service.ts
│       ├── metrics.controller.ts
│       └── metrics.routes.ts
├── swagger/
│   ├── openapi.yaml            # Especificacao OpenAPI 3.0
│   └── swagger.setup.ts        # Configuracao do Swagger UI
└── server.ts
```

---

## Fluxo do Sistema

### Fluxo do Staff

```
                    ADMIN se registra (unico, uma vez)
                                |
                                v
                     ADMIN faz login -> token JWT
                                |
                 +--------------+--------------+
                 |              |              |
                 v              v              v
         Criar ATTENDANT   Ver metricas   Gerenciar clientes
                 |              |              |
                 v              v              v
        ATTENDANT faz login  Dashboard    Atribuir tickets
                 |                            |
                 v                            v
        Ver e gerenciar tickets       Chat com cliente
                 |                      via Socket.IO
                 v
      Atualizar status / prioridade
      Reatribuir para outro atendente
```

### Fluxo do Cliente

```
           Cliente se registra em /client/register
                           |
                           v
              Perfil Client criado automaticamente
              no banco de dados (sem atendente)
                           |
                           v
                 Cliente faz login -> token JWT
                           |
                           v
                 Cliente abre um ticket
                 com titulo + descricao
                           |
                           v
              Atendente pega o ticket
              (reatribuicao via painel do staff)
                           |
                   +-------+-------+
                   |               |
                   v               v
            Cliente entra      Atendente entra
            na sala do         na sala do
            ticket via         ticket via
            Socket.IO          Socket.IO
                   |               |
                   +-------+-------+
                           |
                           v
                 Chat em tempo real comeca
                 Mensagens persistidas no banco
```

### Separacao de Tokens

```
POST /auth/login              POST /client/login
        |                             |
        v                             v
  JWT { role: ADMIN }          JWT { role: CLIENT,
  JWT { role: ATTENDANT }            clientId: "..." }
        |                             |
        v                             v
  authMiddleware               clientMiddleware
  bloqueia role CLIENT         bloqueia role nao-CLIENT
        |                             |
        v                             v
  /users, /clients,            /client/tickets
  /tickets, /metrics           /client/register
                               /client/login
```

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Banco de dados | PostgreSQL |
| ORM | Prisma |
| Tempo real | Socket.IO |
| Validacao | Zod |
| Autenticacao | JWT (jsonwebtoken) |
| Hash de senha | bcrypt |
| Rate limiting | express-rate-limit |
| Documentacao | Swagger UI + OpenAPI 3.0 |

---

## Como Rodar

**Requisitos**

- Node.js 18+
- PostgreSQL rodando localmente ou via Docker

**Instalacao**

```bash
git clone <repo-url>
cd helpdesk-api
npm install
```

**Instalar dependencias do Swagger**

```bash
npm install swagger-ui-express yamljs
npm install -D @types/swagger-ui-express @types/yamljs
```

**Configuracao do banco**

```bash
npx prisma migrate dev
```

**Criar o primeiro admin**

O endpoint `/auth/register` so funciona uma vez — quando o banco nao tem nenhum usuario. Suba o servidor e chame o endpoint:

```bash
POST /auth/register
{
  "name": "Admin",
  "email": "admin@empresa.com",
  "password": "suasenha"
}
```

Apos isso, todos os novos usuarios devem ser criados pelo admin via `POST /users`.

**Rodar o servidor**

```bash
npm run dev
```

O servidor vai iniciar em `http://localhost:4000`.

---

## Variaveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/helpdesk"
JWT_SECRET="seu-secret-forte-aqui"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

O servidor vai lancar um erro e recusar iniciar se `JWT_SECRET` nao estiver definido.

---

## Documentacao Interativa

A documentacao completa da API esta disponivel via Swagger UI. Com o servidor rodando, acesse:

```
http://localhost:4000/docs
```

A interface permite explorar todos os endpoints, ver schemas de request e response, e testar requisicoes diretamente pelo browser.

**Como autenticar no Swagger UI:**

1. Faca login via `POST /auth/login` ou `POST /client/login`
2. Copie o token retornado
3. Clique no botao **Authorize** no topo da pagina
4. Cole o token no campo correspondente (`StaffBearerAuth` ou `ClientBearerAuth`)
5. Clique em **Authorize** e feche o modal
6. Todos os endpoints protegidos ja estarao autenticados

**Configuracao no `server.ts`:**

```typescript
import { setupSwagger } from "./swagger/swagger.setup";

// Adicionar apos definir os middlewares e antes das rotas
setupSwagger(app);
```

O arquivo de especificacao OpenAPI completo esta em `swagger/openapi.yaml` e pode ser importado em ferramentas como Postman, Insomnia ou qualquer client compativel com OpenAPI 3.0.

---

## Autenticacao

Todas as rotas protegidas exigem um token `Bearer` no header `Authorization`:

```
Authorization: Bearer <seu-jwt-token>
```

Os tokens expiram em 7 dias. Tokens de staff e de cliente sao estruturalmente diferentes:

**Payload do token do staff**
```json
{
  "userId": "uuid",
  "role": "ADMIN" | "ATTENDANT"
}
```

**Payload do token do cliente**
```json
{
  "userId": "uuid",
  "clientId": "uuid",
  "role": "CLIENT"
}
```

---

## Referencia da API

### Auth — Staff

#### POST /auth/register
Cria a unica conta de admin. Retorna erro se qualquer usuario ja existir no banco.

Corpo da requisicao:
```json
{
  "name": "string",
  "email": "string",
  "password": "string (minimo 6 caracteres)"
}
```

Resposta `201`:
```json
{
  "message": "Admin registered successfully",
  "user": {
    "name": "string",
    "email": "string"
  }
}
```

---

#### POST /auth/login
Rate limitado a 10 tentativas por IP a cada 15 minutos.

Corpo da requisicao:
```json
{
  "email": "string",
  "password": "string"
}
```

Resposta `200`:
```json
{
  "message": "Login successful",
  "user": { "name": "string", "email": "string" },
  "token": "jwt-token"
}
```

---

### Auth — Cliente

#### POST /client/register
Rate limitado. Cria um `User` com role `CLIENT` e um perfil `Client` vinculado automaticamente.

Corpo da requisicao:
```json
{
  "name": "string",
  "email": "string",
  "password": "string (minimo 6 caracteres)",
  "phone": "string"
}
```

Resposta `201`:
```json
{
  "message": "Client registered successfully",
  "client": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "clientId": "uuid"
  }
}
```

---

#### POST /client/login
Rate limitado. Endpoint exclusivo para clientes — credenciais de staff serao rejeitadas.

Corpo da requisicao:
```json
{
  "email": "string",
  "password": "string"
}
```

Resposta `200`:
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "name": "string",
    "email": "string",
    "clientId": "uuid"
  }
}
```

---

### Usuarios
Todos os endpoints exigem role ADMIN.

#### POST /users
Cria um novo atendente ou admin.

#### GET /users
Retorna todos os usuarios sem a senha.

#### PUT /users/:id
Atualiza nome e email de um usuario.

#### PATCH /users/:id/deactivate
Desativa um usuario. O registro e mantido no banco de dados.

---

### Clientes
Exige role ADMIN ou ATTENDANT. ADMIN ve todos os clientes. ATTENDANT ve apenas os clientes atribuidos a ele.

#### GET /clients
Suporta paginacao e busca.

Query params:
| Parametro | Padrao | Descricao |
|---|---|---|
| page | 1 | Numero da pagina |
| limit | 20 | Resultados por pagina (max 100) |
| search | - | Busca por nome, email ou telefone |

#### GET /clients/:id
Retorna um unico cliente com o atendente atribuido.

#### PUT /clients/:id
Atualiza dados do cliente.

#### DELETE /clients/:id
Remove permanentemente um cliente. Resposta `204`.

---

### Tickets — Staff
Exige role ADMIN ou ATTENDANT.

#### GET /tickets
Retorna lista paginada de todos os tickets.

#### GET /tickets/grouped
Retorna tickets agrupados por status. Ideal para um kanban board.

```json
{
  "NEW": [...],
  "IN_PROGRESS": [...],
  "WAITING_CLIENT": [...],
  "DONE": [...]
}
```

#### PUT /tickets/:id/status
Atualiza o status. Valores validos: `NEW`, `IN_PROGRESS`, `WAITING_CLIENT`, `DONE`.

#### PUT /tickets/:id/priority
Atualiza a prioridade. Valores validos: `LOW`, `MEDIUM`, `HIGH`.

#### PUT /tickets/:id/reassign
Reatribui o ticket para outro atendente via `assignedToId`.

#### GET /tickets/:id/messages
Retorna o historico completo de mensagens ordenado por data.

---

### Tickets — Cliente
Exige token com role CLIENT.

#### POST /client/tickets
Cliente abre um novo ticket com `title` e `description`.

#### GET /client/tickets
Retorna todos os tickets do cliente autenticado.

#### GET /client/tickets/:id
Retorna ticket com historico de mensagens. Cliente so acessa os proprios tickets.

---

### Metricas
Exige role ADMIN ou ATTENDANT.

#### GET /metrics/summary
Retorna todas as metricas em uma unica chamada paralela.

#### GET /metrics/tickets-by-status
Contagem de tickets agrupada por status.

#### GET /metrics/tickets-by-priority
Contagem de tickets agrupada por prioridade.

#### GET /metrics/clients-by-attendant
Numero de clientes por atendente ativo.

#### GET /metrics/resolution-time
Tempo medio de resolucao em horas para tickets com status `DONE`.

---

## Chat em Tempo Real

O chat usa Socket.IO autenticado via JWT no handshake. Tanto clientes quanto staff podem participar da mesma sala de ticket.

**Conexao**

```javascript
const socket = io("http://localhost:4000", {
  auth: { token: "seu-jwt-token" }
});
```

**Eventos emitidos**

| Evento | Payload | Descricao |
|---|---|---|
| `join_ticket` | `ticketId: string` | Entra na sala do ticket |
| `send_message` | `{ ticketId, content }` | Envia uma mensagem |
| `typing` | `{ ticketId }` | Notifica que esta digitando |
| `stop_typing` | `{ ticketId }` | Notifica que parou de digitar |
| `leave_ticket` | `ticketId: string` | Sai da sala do ticket |

**Eventos recebidos**

| Evento | Payload | Descricao |
|---|---|---|
| `receive_message` | `{ id, content, sender, createdAt }` | Nova mensagem na sala |
| `user_typing` | `{ userId, name, role }` | Alguem esta digitando |
| `user_stop_typing` | `{ userId }` | Alguem parou de digitar |
| `error` | `{ message }` | Algo deu errado |

**Regras de seguranca**

- Clientes so podem entrar em salas dos proprios tickets
- Clientes so podem enviar mensagens nos proprios tickets
- Staff pode entrar em qualquer sala de ticket
- Tokens invalidos ou ausentes sao rejeitados no momento da conexao

---

## Permissoes por Role

| Acao | ADMIN | ATTENDANT | CLIENT |
|---|---|---|---|
| Criar admin | Somente no primeiro registro | Nao | Nao |
| Criar usuarios | Sim | Nao | Nao |
| Listar e editar usuarios | Sim | Nao | Nao |
| Desativar usuarios | Sim | Nao | Nao |
| Listar todos os clientes | Sim | Nao | Nao |
| Listar proprios clientes | Sim | Sim | Nao |
| Editar e deletar clientes | Sim | Sim | Nao |
| Listar todos os tickets | Sim | Sim | Nao |
| Atualizar status do ticket | Sim | Sim | Nao |
| Atualizar prioridade do ticket | Sim | Sim | Nao |
| Reatribuir ticket | Sim | Sim | Nao |
| Ver metricas | Sim | Sim | Nao |
| Registrar conta | Nao | Nao | Sim |
| Abrir ticket | Nao | Nao | Sim |
| Ver proprios tickets | Nao | Nao | Sim |
| Chat no proprio ticket | Sim | Sim | Sim |

---

## Seguranca

- O `JWT_SECRET` e obrigatorio na inicializacao — o servidor lanca erro e recusa iniciar sem ele
- Tokens de staff e tokens de cliente sao estruturalmente diferentes e validados separadamente
- Um token de cliente usado em rota de staff retorna `403 Access Denied`
- Um token de staff usado em rota de cliente retorna `403 Access Denied`
- Todas as senhas sao hasheadas com bcrypt (salt rounds: 10)
- Endpoints de login e registro possuem rate limiting (10 requisicoes por 15 minutos por IP)
- Todos os inputs sao validados com Zod antes de chegar na camada de servico
- A posse do ticket e validada no servidor tanto nas rotas REST quanto no Socket.IO

---

## Tratamento de Erros

Todos os endpoints retornam erros no seguinte formato:

```json
{
  "error": "Mensagem legivel"
}
```

Ou para erros de validacao:

```json
{
  "error": {
    "email": ["Invalid email"],
    "password": ["Password must be at least 6 characters"]
  }
}
```

**Codigos HTTP**

| Codigo | Significado |
|---|---|
| 200 | Sucesso |
| 201 | Recurso criado |
| 204 | Sucesso, sem conteudo |
| 400 | Requisicao invalida ou erro de validacao |
| 401 | Token ausente ou invalido |
| 403 | Permissao insuficiente |
| 404 | Recurso nao encontrado |
| 409 | Conflito (email duplicado) |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

---

## Testando o Chat

Para testar o chat em tempo real sem um frontend, crie um arquivo `test-chat.html`, abra em duas abas do browser, cole o token do staff em uma aba e o token do cliente na outra, insira o mesmo ID de ticket e conecte. As mensagens aparecerao em tempo real nos dois lados.

Token do staff: `POST /auth/login`
Token do cliente: `POST /client/login`
ID do ticket: `GET /client/tickets` (logado como cliente)