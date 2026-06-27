# Task 4: Inventário — Bolsas e Insumos

**Files to create:**
- `api/inventory/bolsas.ts` — GET and POST
- `api/inventory/bolsas/[id].ts` — DELETE
- `api/inventory/insumos.ts` — GET and POST
- `api/inventory/insumos/[id].ts` — PUT and DELETE

**What they do:**

`api/inventory/bolsas.ts`:
- GET: lists blood bags in stock. Filters by `status=eq.EM_ESTOQUE`. Optional `?tipo_sangue=` filter. Maps PostgREST response (`id_doacao`, `tipo_sanguineo_coletado`, `volume_ml`, `data_doacao`) to `{id, tipo_sangue, quantidade, created_at}`.
- POST: registers manual stock entry. Creates N bolsa records (each is a `doacoes` row with volume_ml=450, status=EM_ESTOQUE). Uses the first unidade_coleta, the generic donor (cpf=000.000.000-00), and the logged-in user.

`api/inventory/bolsas/[id].ts`:
- DELETE: removes a bolsa by `id_doacao` using service role.

`api/inventory/insumos.ts`:
- GET: lists all insumos ordered by id asc.
- POST: creates an insumo with nome and quantidade. Uses service role.

`api/inventory/insumos/[id].ts`:
- PUT: updates insumo nome and/or quantidade. Uses service role.
- DELETE: removes insumo by id. Uses service role.

**Dependencies consumed:** `requireAuth`, `supabaseFetch`, `getServiceHeaders`, `badRequest`, `notFound` (from Task 1)

**Project:** banco-de-sangue — converting FastAPI backend to Vercel API Routes (Node.js/TypeScript)
**Worktree:** C:\Users\bruno\OneDrive\Desktop\banco-de-sangue\.worktrees\feature-ajustes-gerais
**Branch:** feature/ajustes-gerais

**Report file:** .superpowers/sdd/task-4-report.md
