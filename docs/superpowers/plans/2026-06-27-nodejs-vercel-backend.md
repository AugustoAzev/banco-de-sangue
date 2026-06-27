# Backend Node.js Vercel API Routes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o backend FastAPI (Python) por Vercel API Routes (TypeScript/Node.js) conectando ao Supabase via PostgREST.

**Architecture:** API Routes serverless em `/api/*.ts` fazem fetch direto ao PostgREST do Supabase. Auth via JWT próprio (bcryptjs + jsonwebtoken). Frontend React continua inalterado.

**Tech Stack:** TypeScript, Vercel API Routes, bcryptjs, jsonwebtoken, Supabase PostgREST

---

## Global Constraints

- JWT_SECRET deve ser configurado no dashboard do Vercel
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY configurados no Vercel
- API Routes usam `runtime = 'nodejs18.x'` explícito (ou default)
- Compatibilidade com hash bcrypt `$2b$12$...` existente no banco

---

## File Map

```
/api/
  _lib/
    supabase.ts         # Fetch wrapper para PostgREST
    auth.ts             # JWT sign/verify helpers
    types.ts           # Tipos TypeScript compartilhados
  _middleware/
    auth.ts            # Verifica JWT em todas as rotas
  auth/
    login.ts          # POST /api/auth/login
    me.ts             # GET /api/auth/me
  donors/
    index.ts          # GET, POST /api/donors
    [id].ts           # PUT, DELETE /api/donors/[id]
  inventory/
    bolsas.ts          # GET, POST /api/inventory/bolsas
    bolsas/
      [id].ts        # DELETE /api/inventory/bolsas/[id]
    insumos.ts        # GET, POST /api/inventory/insumos
    insumos/
      [id].ts        # PUT, DELETE /api/inventory/insumos/[id]
  employees/
    index.ts          # GET, POST /api/employees
  health.ts           # GET /api/health
```

---

## Task 1: Setup — Dependências e tipagem base

**Files:**
- Modify: `package.json`
- Create: `api/_lib/types.ts`
- Create: `api/_lib/supabase.ts`
- Create: `api/_lib/auth.ts`
- Create: `api/_middleware/auth.ts`

**Interfaces:**
- Produces: `types.ts` exporta `User`, `TokenPayload`, `ApiError`; `supabase.ts` exporta `supabaseFetch()` e `supabaseAdmin()`; `auth.ts` exporta `signToken(payload)` e `verifyToken(token)`; `_middleware/auth.ts` exporta `authMiddleware()`

- [ ] **Step 1: Adicionar dependências ao package.json**

```json
"dependencies": {
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0"
}
```

Rodar: `npm install bcryptjs jsonwebtoken`

- [ ] **Step 2: Criar api/_lib/types.ts**

```typescript
// Tipos compartilhados

export interface TokenPayload {
  sub: string;    // email
  role: string;    // ADMINISTRADOR | ATENDENTE
  name: string;    // nome completo
  iat?: number;
  exp?: number;
}

export interface User {
  id_usuario: string;
  nome_completo: string;
  email: string;
  tipo: 'ADMINISTRADOR' | 'ATENDENTE';
  cargo?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  name: string;
}

export interface Doador {
  id_doador: string;
  nome_completo: string;
  cpf: string;
  tipo_sanguineo?: string;
  idade?: number;
  sexo?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface DoadorCreate {
  nome: string;
  documento?: string;
  cpf: string;
  tipo_sanguineo: string;
  idade: number;
  sexo: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  condicao_1: boolean;
  condicao_2: boolean;
  condicao_3: boolean;
}

export interface Bolsa {
  id: number;
  tipo_sangue: string;
  quantidade: number;
  created_at?: string;
}

export interface BolsaCreate {
  tipo_sangue: string;
  quantidade: number;
}

export interface Insumo {
  id: number;
  nome: string;
  quantidade: number;
  criado_em?: string;
  atualizado_em?: string;
}

export interface InsumoCreate {
  nome: string;
  quantidade: number;
}
```

- [ ] **Step 3: Criar api/_lib/supabase.ts**

```typescript
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function getSupabaseHeaders(supabaseToken?: string) {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': supabaseToken ? `Bearer ${supabaseToken}` : `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

export function getServiceHeaders() {
  return {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

export async function supabaseFetch(
  path: string,
  options: RequestInit = {},
  serviceRole = false
) {
  const url = `${SUPABASE_URL}${path}`;
  const headers = serviceRole ? getServiceHeaders() : getSupabaseHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  return response;
}

export function unauthorized(message = 'Credenciais inválidas') {
  return NextResponse.json({ detail: message }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ detail: message }, { status: 400 });
}

export function notFound(message: string) {
  return NextResponse.json({ detail: message }, { status: 404 });
}

export function internalError(message: string) {
  return NextResponse.json({ detail: message }, { status: 500 });
}
```

- [ ] **Step 4: Criar api/_lib/auth.ts**

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { TokenPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET!;
const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_HOURS = 1;

export function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${ACCESS_TOKEN_EXPIRE_HOURS}h`,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

- [ ] **Step 5: Criar api/_middleware/auth.ts**

```typescript
import { NextRequest } from 'next/server';
import { verifyToken } from '../_lib/auth';

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function requireAuth(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { authorized: false, error: NextResponse.json({ detail: 'Não autenticado' }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { authorized: false, error: NextResponse.json({ detail: 'Token inválido ou expirado' }, { status: 401 }) };
  }

  return { authorized: true, user: payload };
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json api/_lib/ api/_middleware/
git commit -m "$(cat <<'EOF'
feat: setup base — types, supabase client, JWT helpers, auth middleware

Co-Authored-By: Bruno Souza <brunosouza-alt@users.noreply.github.com>
EOF
)"
```

---

## Task 2: Auth — Login e /me

**Files:**
- Create: `api/auth/login.ts`
- Create: `api/auth/me.ts`
- Create: `tests/api/auth.test.ts`

**Interfaces:**
- Consumes: `supabaseFetch`, `verifyPassword`, `signToken`, `requireAuth`
- Produces: `POST /api/auth/login` → `{access_token, token_type, role, name}`, `GET /api/auth/me` → dados do usuário

- [ ] **Step 1: Criar api/auth/login.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, notFound, unauthorized } from '../../_lib/supabase';
import { verifyPassword, signToken } from '../../_lib/auth';
import type { LoginRequest, LoginResponse } from '../../_lib/types';

export async function POST(request: NextRequest) {
  const body: LoginRequest = await request.json();

  if (!body.email || !body.password) {
    return NextResponse.json({ detail: 'Email e senha são obrigatórios' }, { status: 400 });
  }

  // Busca usuário no Supabase via PostgREST
  const res = await supabaseFetch(
    `/rest/v1/usuarios?email=eq.${encodeURIComponent(body.email)}&select=*&limit=1`
  );

  if (!res.ok) {
    return NextResponse.json({ detail: 'Erro ao buscar usuário' }, { status: 500 });
  }

  const users = await res.json();
  if (!Array.isArray(users) || users.length === 0) {
    return unauthorized('E-mail ou senha incorretos');
  }

  const user = users[0];

  // Verifica senha (suporta hash bcrypt Python existente)
  const valid = await verifyPassword(body.password, user.senha_hash);
  if (!valid) {
    return unauthorized('E-mail ou senha incorretos');
  }

  const role = user.tipo;
  const token = signToken({
    sub: user.email,
    role,
    name: user.nome_completo,
  });

  const response: LoginResponse = {
    access_token: token,
    token_type: 'bearer',
    role,
    name: user.nome_completo,
  };

  return NextResponse.json(response);
}
```

- [ ] **Step 2: Criar api/auth/me.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../_middleware/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  return NextResponse.json({
    name: auth.user.name,
    role: auth.user.role,
    email: auth.user.sub,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add api/auth/
git commit -m "$(cat <<'EOF'
feat(auth): login e /me — JWT com Supabase PostgREST

Co-Authored-By: Bruno Souza <brunosouza-alt@users.noreply.github.com>
EOF
)"
```

---

## Task 3: Doadores CRUD

**Files:**
- Create: `api/donors/index.ts`
- Create: `api/donors/[id].ts`

**Interfaces:**
- Consumes: `requireAuth`, `supabaseFetch`, `getServiceHeaders`
- Produces: `GET/POST /api/donors`, `PUT/DELETE /api/donors/[id]`

- [ ] **Step 1: Criar api/donors/index.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../_middleware/auth';
import { supabaseFetch, badRequest } from '../_lib/supabase';
import type { DoadorCreate } from '../_lib/types';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  let path = '/rest/v1/doadores?select=*';
  if (query) {
    path += `&or=(nome_completo.ilike.*${encodeURIComponent(query)}*,cpf.ilike.*${encodeURIComponent(query)}*)`;
  }

  const res = await supabaseFetch(path);
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const body: DoadorCreate = await request.json();

  if (!body.nome || !body.cpf || !body.tipo_sanguineo || body.idade === undefined || !body.sexo) {
    return badRequest('Campos obrigatórios faltando');
  }

  // Verifica triagem
  if (!body.condicao_1 || !body.condicao_2 || !body.condicao_3) {
    return badRequest('O doador não atende aos critérios de elegibilidade.');
  }

  // Verifica CPF duplicado
  const checkRes = await supabaseFetch(
    `/rest/v1/doadores?cpf=eq.${encodeURIComponent(body.cpf)}&select=id_doador&limit=1`
  );
  const existing = await checkRes.json();
  if (Array.isArray(existing) && existing.length > 0) {
    return badRequest('CPF já cadastrado.');
  }

  const payload = {
    id_doador: crypto.randomUUID(),
    nome_completo: body.nome,
    cpf: body.cpf,
    tipo_sanguineo: body.tipo_sanguineo,
    idade: body.idade,
    sexo: body.sexo,
    email: body.email || null,
    telefone: body.telefone || null,
    endereco: body.endereco || null,
  };

  const res = await supabaseFetch('/rest/v1/doadores', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  }, true); // service role para bypassar RLS no insert

  if (!res.ok) {
    return NextResponse.json({ detail: 'Erro ao cadastrar doador' }, { status: 422 });
  }

  const created = await res.json();
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: Criar api/donors/[id].ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../_middleware/auth';
import { supabaseFetch, notFound, badRequest } from '../_lib/supabase';
import type { DoadorCreate } from '../_lib/types';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const body: DoadorCreate = await request.json();
  const id = params.id;

  const payload: Record<string, unknown> = {
    nome_completo: body.nome,
    tipo_sanguineo: body.tipo_sanguineo,
    idade: body.idade,
    sexo: body.sexo,
    email: body.email || null,
    telefone: body.telefone || null,
    endereco: body.endereco || null,
  };

  const res = await supabaseFetch(
    `/rest/v1/doadores?id_doador=eq.${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    true
  );

  if (!res.ok) {
    return badRequest('Erro ao atualizar dados.');
  }

  const updated = await res.json();
  if (!Array.isArray(updated) || updated.length === 0) {
    return notFound('Doador não encontrado');
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const id = params.id;

  // Verifica se tem doações vinculadas
  const checkRes = await supabaseFetch(
    `/rest/v1/doacoes?id_doador=eq.${id}&select=id_doacao&limit=1`
  );
  const donations = await checkRes.json();
  if (Array.isArray(donations) && donations.length > 0) {
    return badRequest('Não é possível excluir este doador pois existem doações vinculadas a ele.');
  }

  const res = await supabaseFetch(
    `/rest/v1/doadores?id_doador=eq.${id}`,
    { method: 'DELETE' },
    true
  );

  if (!res.ok) {
    return badRequest('Erro ao excluir doador.');
  }

  return NextResponse.json({ message: 'Doador removido com sucesso' });
}
```

- [ ] **Step 3: Commit**

```bash
git add api/donors/
git commit -m "$(cat <<'EOF'
feat(donors): CRUD completo de doadores via PostgREST

Co-Authored-By: Bruno Souza <brunosouza-alt@users.noreply.github.com>
EOF
)"
```

---

## Task 4: Inventário — Bolsas e Insumos

**Files:**
- Create: `api/inventory/bolsas.ts`
- Create: `api/inventory/bolsas/[id].ts`
- Create: `api/inventory/insumos.ts`
- Create: `api/inventory/insumos/[id].ts`

**Interfaces:**
- Consumes: `requireAuth`, `supabaseFetch`, `getServiceHeaders`
- Produces: `GET/POST /api/inventory/bolsas`, `DELETE /api/inventory/bolsas/[id]`, `CRUD /api/inventory/insumos`

- [ ] **Step 1: Criar api/inventory/bolsas.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../_middleware/auth';
import { supabaseFetch, badRequest } from '../../_lib/supabase';
import type { BolsaCreate } from '../../_lib/types';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);
  const tipoSangue = searchParams.get('tipo_sangue');

  let path = '/rest/v1/doacoes?status=eq.EM_ESTOQUE&select=*';
  if (tipoSangue) {
    path += `&tipo_sanguineo_coletado=eq.${tipoSangue}`;
  }

  const res = await supabaseFetch(path);
  const data = await res.json();

  const bolsas = Array.isArray(data) ? data.map((item: Record<string, unknown>) => ({
    id: item.id_doacao,
    tipo_sangue: item.tipo_sanguineo_coletado,
    quantidade: parseInt(String(item.volume_ml)),
    created_at: item.data_doacao,
  })) : [];

  return NextResponse.json(bolsas);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const body: BolsaCreate = await request.json();

  if (!body.tipo_sangue || !body.quantidade) {
    return badRequest('tipo_sangue e quantidade são obrigatórios');
  }

  if (body.quantidade < 1) {
    return badRequest('quantidade deve ser maior que 0');
  }

  // Busca unidade e doador genérico
  const [unidadeRes, doadorRes, userRes] = await Promise.all([
    supabaseFetch('/rest/v1/unidades_coleta?select=id_unidade&limit=1'),
    supabaseFetch('/rest/v1/doadores?cpf=eq.000.000.000-00&select=id_doador&limit=1'),
    supabaseFetch(`/rest/v1/usuarios?email=eq.${encodeURIComponent(auth.user.sub)}&select=id_usuario&limit=1`),
  ]);

  const [unidades, doadores, usuarios] = await Promise.all([
    unidadeRes.json(), doadorRes.json(), userRes.json()
  ]);

  if (!Array.isArray(unidades) || unidades.length === 0) {
    return badRequest('Nenhuma Unidade de Coleta cadastrada.');
  }
  if (!Array.isArray(doadores) || doadores.length === 0) {
    return badRequest('Cadastre ao menos um doador antes de lançar estoque.');
  }
  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    return badRequest('Usuário logado não encontrado.');
  }

  const idUnidade = unidades[0].id_unidade;
  const idDoador = doadores[0].id_doador;
  const idRegistrador = usuarios[0].id_usuario;

  // Cria bolsas (cada uma é um registro de Doacao)
  const promises = Array.from({ length: body.quantidade }, () => {
    const payload = {
      id_doacao: crypto.randomUUID(),
      volume_ml: 450,
      observacoes: 'Entrada Manual via Estoque',
      status: 'EM_ESTOQUE',
      tipo_sanguineo_coletado: body.tipo_sangue,
      id_doador: idDoador,
      id_registrador: idRegistrador,
      id_unidade: idUnidade,
    };
    return supabaseFetch('/rest/v1/doacoes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  });

  await Promise.all(promises);

  return NextResponse.json({ message: `${body.quantidade} bolsas registradas com sucesso` });
}
```

- [ ] **Step 2: Criar api/inventory/bolsas/[id].ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../_middleware/auth';
import { supabaseFetch } from '../../../_lib/supabase';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const res = await supabaseFetch(
    `/rest/v1/doacoes?id_doacao=eq.${params.id}`,
    { method: 'DELETE' },
    true
  );

  if (!res.ok) {
    return NextResponse.json({ detail: 'Erro ao remover bolsa' }, { status: 400 });
  }

  return NextResponse.json({ message: 'Registro removido com sucesso' });
}
```

- [ ] **Step 3: Criar api/inventory/insumos.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../_middleware/auth';
import { supabaseFetch, notFound } from '../../_lib/supabase';
import type { InsumoCreate } from '../../_lib/types';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const res = await supabaseFetch('/rest/v1/insumos?select=*&order=id.asc');
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const body: InsumoCreate = await request.json();

  if (!body.nome || body.quantidade === undefined) {
    return NextResponse.json({ detail: 'nome e quantidade são obrigatórios' }, { status: 400 });
  }

  const res = await supabaseFetch('/rest/v1/insumos', {
    method: 'POST',
    body: JSON.stringify({ nome: body.nome, quantidade: body.quantidade }),
  }, true);

  if (!res.ok) {
    return NextResponse.json({ detail: 'Erro ao criar insumo' }, { status: 422 });
  }

  const created = await res.json();
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 4: Criar api/inventory/insumos/[id].ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../_middleware/auth';
import { supabaseFetch, notFound } from '../../../_lib/supabase';
import type { InsumoCreate } from '../../../_lib/types';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const body: InsumoCreate = await request.json();

  const res = await supabaseFetch(
    `/rest/v1/insumos?id=eq.${params.id}`,
    { method: 'PATCH', body: JSON.stringify({ nome: body.nome, quantidade: body.quantidade }) },
    true
  );

  const data = await res.json();
  if (!res.ok || !Array.isArray(data) || data.length === 0) {
    return notFound('Insumo não encontrado');
  }

  return NextResponse.json(data[0]);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const res = await supabaseFetch(
    `/rest/v1/insumos?id=eq.${params.id}`,
    { method: 'DELETE' },
    true
  );

  if (!res.ok) {
    return NextResponse.json({ detail: 'Erro ao excluir insumo' }, { status: 400 });
  }

  return NextResponse.json({ message: 'Insumo removido' });
}
```

- [ ] **Step 5: Commit**

```bash
git add api/inventory/
git commit -m "$(cat <<'EOF'
feat(inventory): bolsas e insumos CRUD via PostgREST

Co-Authored-By: Bruno Souza <brunosouza-alt@users.noreply.github.com>
EOF
)"
```

---

## Task 5: Employees e Health

**Files:**
- Create: `api/employees/index.ts`
- Create: `api/health.ts`

**Interfaces:**
- Consumes: `requireAuth`, `supabaseFetch`, `hashPassword`, `getServiceHeaders`
- Produces: `GET/POST /api/employees`, `GET /api/health`

- [ ] **Step 1: Criar api/employees/index.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../_middleware/auth';
import { supabaseFetch, badRequest } from '../_lib/supabase';
import { hashPassword } from '../_lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  let path = '/rest/v1/usuarios?select=id_usuario,nome_completo,cargo,cpf,pis,telefone,email,tipo,criado_em&order=nome_completo.asc';
  if (query) {
    path = `/rest/v1/usuarios?or=(nome_completo.ilike.*${encodeURIComponent(query)}*,cargo.ilike.*${encodeURIComponent(query)}*)&select=id_usuario,nome_completo,cargo,cpf,pis,telefone,email,tipo,criado_em&order=nome_completo.asc`;
  }

  const res = await supabaseFetch(path);
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const body = await request.json();

  const { name, email, password, cpf, pis, cargo, telefone } = body;

  if (!name || !email || !password) {
    return badRequest('name, email e password são obrigatórios');
  }

  // Verifica CPF duplicado
  if (cpf) {
    const checkRes = await supabaseFetch(
      `/rest/v1/usuarios?cpf=eq.${encodeURIComponent(cpf)}&select=id_usuario&limit=1`
    );
    const existing = await checkRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return badRequest('CPF já cadastrado');
    }
  }

  const senhaHash = await hashPassword(password);

  const payload = {
    id_usuario: crypto.randomUUID(),
    nome_completo: name,
    email,
    senha_hash: senhaHash,
    tipo: 'ATENDENTE',
    cpf: cpf || null,
    pis: pis || null,
    cargo: cargo || null,
    telefone: telefone || null,
  };

  const res = await supabaseFetch('/rest/v1/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);

  if (!res.ok) {
    return NextResponse.json({ detail: 'Erro ao criar funcionário' }, { status: 422 });
  }

  const created = await res.json();
  return NextResponse.json({
    id_usuario: created[0]?.id_usuario || payload.id_usuario,
    tipo: 'ATENDENTE',
    ...payload,
  }, { status: 201 });
}
```

- [ ] **Step 2: Criar api/health.ts**

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

- [ ] **Step 3: Commit**

```bash
git add api/employees/ api/health.ts
git commit -m "$(cat <<'EOF'
feat: employees CRUD e health endpoint

Co-Authored-By: Bruno Souza <brunosouza-alt@users.noreply.github.com>
EOF
)"
```

---

## Task 6: Limpeza — remover código Python e configs obsoletas

**Files:**
- Delete: `backend/` (pasta inteira)
- Delete: `alembic/` (pasta inteira)
- Delete: `prisma/` (pasta inteira)
- Delete: `seed_data.py`
- Delete: `seed_user.py`
- Delete: `backup_completo.sql`
- Delete: `alembic.ini`
- Modify: `vite.config.ts` (remover proxy /api)
- Modify: `.gitignore` (remover entries do Python/Alembic)
- Modify: `package.json` (remover prisma)
- Modify: `src/App.tsx` (opcional: ajustar rotas se necessário)

**Interfaces:**
- Consumes: nenhuma dependência
- Produces: projeto limpo só com TypeScript/React

- [ ] **Step 1: Deletar código Python e configs obsoletas**

```bash
# No diretório do worktree
rm -rf backend/ alembic/ prisma/ seed_data.py seed_user.py backup_completo.sql alembic.ini
```

- [ ] **Step 2: Limpar vite.config.ts**

Remover a seção `proxy` do `server`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  }
})
```

- [ ] **Step 3: Limpar package.json**

Remover `prisma` e `@prisma/client` das dependências.

- [ ] **Step 4: Limpar .gitignore**

Remover entradas relacionadas a Python/Alembic:
- `backend/venv/`, `__pycache__/`, `*.py[cod]`, `backend/.env`, `alembic/__pycache__/`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor!: remove backend Python, alembic, prisma — чисто Node.js

Agora o projeto é 100% TypeScript/React + Vercel API Routes
conectando ao Supabase via PostgREST.

Co-Authored-By: Bruno Souza <brunosouza-alt@users.noreply.github.com>
EOF
)"
```

---

## Task 7: Configurar variáveis de ambiente no Vercel

**Files:**
- Modify: `.env.example` (atualizar com variáveis do Vercel)

**Interfaces:**
- Consumes: Variáveis do dashboard do Vercel
- Produces: `vercel.json` com env vars para staging

- [ ] **Step 1: Criar/editar vercel.json com env vars**

```json
{
  "env": {
    "JWT_SECRET": "@jwt-secret",
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  },
  "buildCommand": "npm run build",
  "devCommand": "npm run dev"
}
```

- [ ] **Step 2: Atualizar .env.example**

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT
JWT_SECRET=uma_chave_secreta_minimo_32_caracteres
```

- [ ] **Step 3: Commit**

```bash
git add vercel.json .env.example
git commit -m "$(cat <<'EOF'
chore: add vercel.json e atualizar .env.example

Co-Authored-By: Bruno Souza <brunosouza-alt@users.noreply.github.com>
EOF
)"
```

---

## Self-Review Checklist

- [ ] Spec coverage: Auth (login + /me), CRUD donors, CRUD inventory (bolsas + insumos), CRUD employees, health ✓
- [ ] Placeholder scan: Nenhum TBD, TODO ou código incompleto ✓
- [ ] Type consistency: Todos os tipos definidos em `types.ts`, usados consistentemente ✓
- [ ] Duas rotas GET em `/api/donors` e `/api/donors/[id]` — Next.js diferencia pelo método (GET/POST vs PUT/DELETE) ✓
- [ ] bcryptjs compatível com hashes `$2b$12$` do Python ✓
- [ ] Service role key usado apenas em operações de escrita (INSERT/DELETE/PATCH) para bypassar RLS ✓
