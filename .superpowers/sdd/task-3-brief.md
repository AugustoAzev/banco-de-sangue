# Task 3: Doadores CRUD

**Files to create:**
- `api/donors/index.ts` — GET and POST
- `api/donors/[id].ts` — PUT and DELETE

**What they do:**

`api/donors/index.ts`:
- GET: lists all donors. Optional `?query=` filter searches nome_completo and cpf via PostgREST `or=(nome_completo.ilike.*x*,cpf.ilike.*x*)`
- POST: creates a donor. Validates required fields (nome, cpf, tipo_sanguineo, idade, sexo). Checks triagem conditions (condicao_1, condicao_2, condicao_3 must all be true). Checks CPF duplicate via PostgREST. Uses `crypto.randomUUID()` for id_doador. Uses service role key for INSERT.

`api/donors/[id].ts`:
- PUT: updates donor fields (nome, tipo_sanguineo, idade, sexo, email, telefone, endereco). Uses PATCH via PostgREST.
- DELETE: checks for linked donations before deletion. Uses service role key for DELETE.

**Dependencies consumed:** `requireAuth`, `supabaseFetch`, `getServiceHeaders`, `badRequest`, `notFound` (from Task 1)

**Project:** banco-de-sangue — converting FastAPI backend to Vercel API Routes (Node.js/TypeScript)
**Worktree:** C:\Users\bruno\OneDrive\Desktop\banco-de-sangue\.worktrees\feature-ajustes-gerais
**Branch:** feature/ajustes-gerais

**Report file:** .superpowers/sdd/task-3-report.md
