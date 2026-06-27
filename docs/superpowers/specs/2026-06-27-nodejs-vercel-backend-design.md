# Design: Backend Node.js como Vercel Serverless Functions

**Projeto:** banco-de-sangue
**Data:** 2026-06-27
**Status:** Aprovado

---

## 1. Visão Geral

Converter o backend FastAPI (Python) em API Routes serverless do Vercel (Node.js/TypeScript), mantendo o frontend React inalterado no Vercel. Conexão com banco via Supabase PostgREST.

## 2. Arquitetura

```
Browser (React/Vercel) → Vercel API Routes → Supabase PostgREST → PostgreSQL
```

| Camada | Responsabilidade |
|--------|----------------|
| Vercel API Routes | Auth (JWT, bcrypt), validações, lógica de negócio |
| Supabase PostgREST | CRUD direto via REST + RLS Policies |
| Supabase PostgreSQL | Persistência |

## 3. Autenticação

- Usar `bcryptjs` para hash de senhas (mesmo hash bcrypt que o Python usava — `$2b$12$...`).
- Criar JWT próprio com `jsonwebtoken`, assinado com `JWT_SECRET` do environment.
- Frontend envia `email` + `password` → `POST /api/auth/login` → valida contra Supabase via PostgREST → retorna JWT.
- JWT é stateless; todas as rotas verificam via middleware.

### Endpoints Auth

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login: `{email, password}` → `{access_token, token_type, role, name}` |
| GET | `/api/auth/me` | Retorna dados do usuário logado (decodifica JWT) |

## 4. API Routes (CRUD)

Todas as rotas usam PostgREST via `fetch` com headers de auth do Supabase.

### Doadores

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/donors` | Lista todos os doadores |
| POST | `/api/donors` | Cria doador (verifica CPF duplicado) |
| PUT | `/api/donors/[id]` | Atualiza doador |
| DELETE | `/api/donors/[id]` | Remove doador |

### Estoque / Bolsas

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/inventory/bolsas` | Lista bolsas em estoque (status=EM_ESTOQUE) |
| POST | `/api/inventory/bolsas` | Registra entrada manual |
| DELETE | `/api/inventory/bolsas/[id]` | Remove bolsa |

### Insumos

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/inventory/insumos` | Lista insumos |
| POST | `/api/inventory/insumos` | Cria insumo |
| PUT | `/api/inventory/insumos/[id]` | Atualiza insumo |
| DELETE | `/api/inventory/insumos/[id]` | Remove insumo |

### Funcionários

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/employees` | Lista funcionários |
| POST | `/api/employees` | Cria funcionário |

### Health

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/health` | `{status: "ok"}` |

## 5. Estrutura de Arquivos

```
/api/
  _lib/
    supabase.ts          # Cliente PostgREST (fetch wrapper)
    auth.ts              # Helpers JWT (sign, verify)
    types.ts             # Tipos TypeScript compartilhados
  _middleware/auth.ts    # Verifica JWT em todas as rotas
  auth/
    login.ts             # POST /api/auth/login
    me.ts               # GET /api/auth/me
  donors/
    index.ts            # GET, POST /api/donors
    [id].ts             # PUT, DELETE /api/donors/[id]
  inventory/
    bolsas.ts           # GET, POST /api/inventory/bolsas
    [id].ts            # DELETE /api/inventory/bolsas/[id]
    insumos.ts          # CRUD /api/inventory/insumos
    insumos/[id].ts    # PUT, DELETE /api/inventory/insumos/[id]
  employees/
    index.ts            # GET, POST /api/employees
  health.ts             # GET /api/health
```

## 6. Variáveis de Ambiente

```env
JWT_SECRET=               # Chave para assinar JWTs
SUPABASE_URL=             # https://xxxxx.supabase.co
SUPABASE_ANON_KEY=        # Chave pública anon do Supabase
SUPABASE_SERVICE_ROLE_KEY= # (para operações server-side que precisam bypassar RLS)
```

## 7. Dependências

```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "typescript": "^5.0.0"
}
```

O Vercel já inclui `node-fetch` nativamente. Não precisa de cliente HTTP extra.

## 8. Migração do Frontend

- `src/services/api.ts` já usa `baseURL: '/api'` — **sem mudança**.
- `src/contexts/AuthContext.tsx` já armazena `access_token` — **sem mudança**.
- Auth interceptor 401 já faz `signOut()` — **sem mudança**.

A única mudança é o `baseURL` em produção (já é `/api` que aponta pro Vercel).

## 9. O que é removido

- `/backend/` — deletar ou mover para `/legacy/backend/`
- `alembic/` — migrations não são mais necessárias (Supabase já gerencia)
- `prisma/` — mesmo, não necessário
- `seed_data.py`, `seed_user.py` — dados já estão no Supabase via migration SQL
- `vite.config.ts` — remover proxy `/api` (não precisa mais em dev, já que não há backend separado)

## 10. Testes

- Manter testes pytest como referência conceitual (traduzir para Jest/Vitest se necessário)
- Adicionar testes das API routes com `node-mocks-http` ou similar
