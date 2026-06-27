# Task 5: Employees e Health

**Files to create:**
- `api/employees/index.ts` — GET and POST
- `api/health.ts` — GET

**What they do:**

`api/employees/index.ts`:
- GET: lists all users. Optional `?query=` filter searches nome_completo and cargo. Selects: id_usuario, nome_completo, cargo, cpf, pis, telefone, email, tipo, criado_em. Ordered by nome_completo asc.
- POST: creates a new atendente user. Hashes password with bcryptjs. Checks CPF duplicate if provided. Generates UUID with crypto.randomUUID(). Uses service role for INSERT. New users are always `ATENDENTE` tipo.

`api/health.ts`:
- GET: returns `{status: 'ok'}` — no auth required.

**Dependencies consumed:** `requireAuth`, `supabaseFetch`, `hashPassword`, `getServiceHeaders`, `badRequest` (from Task 1)

**Project:** banco-de-sangue — converting FastAPI backend to Vercel API Routes (Node.js/TypeScript)
**Worktree:** C:\Users\bruno\OneDrive\Desktop\banco-de-sangue\.worktrees\feature-ajustes-gerais
**Branch:** feature/ajustes-gerais

**Report file:** .superpowers/sdd/task-5-report.md
