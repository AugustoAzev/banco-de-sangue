# Task 1: Setup — Dependências e tipagem base

**Files to create/modify:**
- Modify: `package.json` — add `bcryptjs` and `jsonwebtoken`
- Create: `api/_lib/types.ts` — shared TypeScript interfaces
- Create: `api/_lib/supabase.ts` — PostgREST fetch wrapper with helpers
- Create: `api/_lib/auth.ts` — JWT sign/verify and bcrypt helpers
- Create: `api/_middleware/auth.ts` — auth middleware

**Exports produced:**
- `types.ts`: `User`, `TokenPayload`, `ApiError`, `LoginRequest`, `LoginResponse`, `Doador`, `DoadorCreate`, `Bolsa`, `BolsaCreate`, `Insumo`, `InsumoCreate`
- `supabase.ts`: `supabaseFetch()`, `getServiceHeaders()`, `getSupabaseHeaders()`, `unauthorized()`, `badRequest()`, `notFound()`, `internalError()`
- `auth.ts`: `signToken()`, `verifyToken()`, `hashPassword()`, `verifyPassword()`
- `_middleware/auth.ts`: `getTokenFromRequest()`, `requireAuth()`

**Global constraints:**
- JWT_SECRET must be configured in Vercel dashboard
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY must be configured
- API Routes use nodejs18.x runtime
- bcryptjs must be compatible with existing `$2b$12$...` hashes in the DB

**Project:** banco-de-sangue — converting FastAPI backend to Vercel API Routes (Node.js/TypeScript)
**Worktree:** C:\Users\bruno\OneDrive\Desktop\banco-de-sangue\.worktrees\feature-ajustes-gerais
**Branch:** feature/ajustes-gerais
**Commit to diff from:** 862972e

**Report file:** .superpowers/sdd/task-1-report.md
