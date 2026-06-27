# Task 2: Auth — Login e /me

**Files to create:**
- `api/auth/login.ts` — POST /api/auth/login
- `api/auth/me.ts` — GET /api/auth/me

**What they do:**

`api/auth/login.ts`:
- Accepts `{email, password}` JSON body
- Queries PostgREST: `/rest/v1/usuarios?email=eq.{email}&select=*&limit=1`
- Verifies password with bcryptjs against `senha_hash` field
- Signs JWT with role, name, email
- Returns `{access_token, token_type, role, name}`

`api/auth/me.ts`:
- Reads Authorization: Bearer header
- Verifies JWT with verifyToken()
- Returns `{name, role, email}` of the logged-in user

**Dependencies consumed:** `supabaseFetch`, `verifyPassword`, `signToken`, `requireAuth` (from Task 1)

**Project:** banco-de-sangue — converting FastAPI backend to Vercel API Routes (Node.js/TypeScript)
**Worktree:** C:\Users\bruno\OneDrive\Desktop\banco-de-sangue\.worktrees\feature-ajustes-gerais
**Branch:** feature/ajustes-gerais

**Report file:** .superpowers/sdd/task-2-report.md
