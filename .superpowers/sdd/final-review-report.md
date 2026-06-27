# Final Branch Review Report

**Branch:** `feature-ajustes-gerais`
**Project:** banco-de-sangue — FastAPI to Vercel API Routes migration
**Date:** 2026-06-27
**Reviewer:** Claude Code (superpowers:code-reviewer)

---

## Verdict: **FAIL** (1 critical issue — must fix before merge)

All endpoints are present, the architecture is sound, and the implementation is largely correct. However, one package.json misconfiguration will cause the Vercel deployment to fail silently at runtime.

---

## Critical Issues

### 1. `bcryptjs` and `jsonwebtoken` are in `devDependencies`, not `dependencies`

**File:** `package.json`

The runtime dependencies `bcryptjs` and `jsonwebtoken` are listed under `devDependencies`. In a Vercel deployment, only `dependencies` are installed on the server at runtime. This means both packages will be absent when the API Routes execute, causing immediate failures on any endpoint that calls `verifyPassword`, `signToken`, `hashPassword`, or `verifyToken`.

The types `@types/bcryptjs` and `@types/jsonwebtoken` are correctly in `devDependencies` — those are only needed for TypeScript compilation, which Vercel handles via `tsc` in the build step.

**Fix:**

```json
"dependencies": {
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "next": "^15.3.0",
  "react": "^19.1.0",
  ...
},
"devDependencies": {
  "@types/bcryptjs": "^2.4.6",
  "@types/jsonwebtoken": "^9.0.7",
  ...
}
```

---

## Spec Coverage: PASS

All endpoints from the design spec are implemented:

| Endpoint | Method | File | Status |
|---|---|---|---|
| `/api/auth/login` | POST | `api/auth/login.ts` | OK |
| `/api/auth/me` | GET | `api/auth/me.ts` | OK |
| `/api/donors` | GET | `api/donors/index.ts` | OK |
| `/api/donors` | POST | `api/donors/index.ts` | OK |
| `/api/donors/[id]` | PUT | `api/donors/[id].ts` | OK |
| `/api/donors/[id]` | DELETE | `api/donors/[id].ts` | OK |
| `/api/inventory/bolsas` | GET | `api/inventory/bolsas.ts` | OK |
| `/api/inventory/bolsas` | POST | `api/inventory/bolsas.ts` | OK |
| `/api/inventory/bolsas/[id]` | DELETE | `api/inventory/bolsas/[id].ts` | OK |
| `/api/inventory/insumos` | GET | `api/inventory/insumos.ts` | OK |
| `/api/inventory/insumos` | POST | `api/inventory/insumos.ts` | OK |
| `/api/inventory/insumos/[id]` | PUT | `api/inventory/insumos/[id].ts` | OK |
| `/api/inventory/insumos/[id]` | DELETE | `api/inventory/insumos/[id].ts` | OK |
| `/api/employees` | GET | `api/employees/index.ts` | OK |
| `/api/employees` | POST | `api/employees/index.ts` | OK |
| `/api/health` | GET | `api/health.ts` | OK (no auth) |

All 7 setup files are present: `api/_lib/types.ts`, `api/_lib/supabase.ts`, `api/_lib/auth.ts`, `api/_middleware/auth.ts`.

---

## Global Constraints: PASS

| Constraint | Status |
|---|---|
| bcryptjs compatible with `$2b$12$...` hashes | PASS — `bcryptjs` reads `$2b$` prefix natively |
| Service role key for write operations | PASS — all POST/PATCH/DELETE use `getServiceHeaders()` |
| `crypto.randomUUID()` for UUID generation | PASS — used in donors and bolsas |
| No direct database connection | PASS — all queries go through PostgREST `fetch` |
| Auth middleware on all routes except `/health` | PASS — every handler calls `requireAuth()` |

---

## Quality Issues (Non-blocking)

### 2. Inconsistent inline service-role fetch vs `getServiceHeaders()` helper

Several write operations build the service headers inline instead of using `getServiceHeaders()` from `supabase.ts`:

- `api/inventory/bolsas/[id].ts` (DELETE) — lines 831-840
- `api/inventory/insumos.ts` (POST) — lines 906-913
- `api/inventory/insumos/[id].ts` (PUT and DELETE) — lines 978-989 and 1021-1030
- `api/donors/[id].ts` (PUT and DELETE) — lines 371-375 and 418-421
- `api/donors/index.ts` (POST) — lines 522-526
- `api/employees/index.ts` (POST) — lines 645-649

**Impact:** Minor — the inline construction is functionally identical to `getServiceHeaders()`. Flagged because it creates maintenance surface area: if the header format ever changes, there are 6+ call sites to update instead of 1.

**Fix:** Refactor to use `getServiceHeaders()` consistently, or update the helper to accept an optional body/headers override.

### 3. `donors/index.ts` uses `randomUUID` from `crypto` but `bolsas.ts` does not

Both files import from `crypto` differently (`import { randomUUID } from 'crypto'` in donors; `import { randomUUID } from 'crypto'` in bolsas). This is consistent — both import correctly. No issue.

### 4. Bolsas POST batches N inserts in one `fetch` call correctly

The `POST /api/inventory/bolsas` correctly sends all N bolsa payloads in a single POST with ` Prefer: return=representation`, which PostgREST handles as a bulk insert. This is efficient and correct.

### 5. No duplicate commit for Bolsas DELETE service-role pattern

`api/inventory/bolsas/[id].ts` builds headers inline (`process.env.SUPABASE_SERVICE_ROLE_KEY!` x2) instead of using `getServiceHeaders()`. Same concern as issue #2 above.

---

## Minor Findings (Do Not Block Merge)

- **`doadores` PUT does not update the CPF field** — the body allows `cpf` to be sent but it's not mapped to any payload field. Since CPF is immutable by design this is probably intentional, but worth a comment in the type definition.
- **No `email` uniqueness check on employees** — a duplicate `email` on `usuarios` would fail at the database constraint level (422) with a generic error. A friendly "email já cadastrado" message would be better UX. Low priority.
- **`/api/inventory/insumos` POST does not check for duplicate `nome`** — same pattern as above.
- **`GET /api/inventory/insumos` does not support `?query=` filter** — unlike donors and employees. Inconsistency with the spec (GET supports no params per design spec, so this is actually spec-compliant — just noting it).
- **No role guard** — any authenticated user (ADMINISTRADOR or ATENDENTE) can create donors, delete donors, create employees. The spec does not specify role-based access control, so this is by design. Worth documenting if the product evolves.

---

## Cleanup Verification: PASS

Confirmed deleted from the repo:
- `backend/` — absent
- `alembic/` — absent
- `prisma/` — absent (Prisma packages remain in `node_modules` from prior install; `package.json` itself no longer declares them)
- `seed_data.py`, `seed_user.py`, `alembic.ini` — absent
- `vite.config.ts` — proxy block removed (clean)

`supabase_migration.sql` and `backup_completo.sql` are retained, which is correct — they are the source of truth for the Supabase schema.

---

## Config Verification: PASS

| File | Status |
|---|---|
| `vercel.json` | Present — correctly declares all 4 env vars with `@`-prefixed Vercel secrets |
| `.env.example` | Present — documents all 4 required variables with placeholder values |
| `vite.config.ts` | Clean — no proxy block |

---

## Recommended Fixes (Priority Order)

1. **[Critical — Block Merge]** Move `bcryptjs` and `jsonwebtoken` from `devDependencies` to `dependencies` in `package.json`. After fix: run `npm install` and commit.
2. **[Minor — Post-merge]** Standardize all service-role fetch calls to use `getServiceHeaders()` from `supabase.ts`.
3. **[Minor — Post-merge]** Add `email` uniqueness check to `POST /api/employees`.
4. **[Minor — Post-merge]** Add comment to `Doador` type noting CPF immutability on PUT.

---

## Summary

The implementation is structurally complete and well-organized. The only blocker is the missing runtime dependencies in `package.json`. Once that single fix is applied, the branch is ready to merge.
