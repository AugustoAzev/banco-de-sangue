# Task 2 Report: Auth — Login e /me

**Status:** DONE

## Commits

- `10fc143` feat: auth endpoints — login POST and /me GET

## Files Created

- `api/auth/login.ts` — POST /api/auth/login
- `api/auth/me.ts` — GET /api/auth/me

## Implementation

**api/auth/login.ts:**
- Parses `{email, password}` JSON body
- Queries PostgREST: `/rest/v1/usuarios?email=eq.{email}&select=*&limit=1`
- Verifies password with `verifyPassword()` (bcryptjs) against `senha_hash`
- Signs JWT with `signToken({sub: email, role, name})`
- Returns `{access_token, token_type: 'bearer', role, name}`
- Returns 400 for malformed body / missing fields, 401 for invalid credentials

**api/auth/me.ts:**
- Calls `requireAuth(request)` from `_middleware/auth`
- Returns `{name, role, email}` from the verified JWT payload

## Test Summary

TypeScript compilation: clean (only pre-existing node_modules/next errors, no errors in new files). Both handlers follow the Vercel API Route pattern (`export async function POST/GET`). All dependencies consumed from Task 1 (`supabaseFetch`, `badRequest`, `unauthorized`, `signToken`, `verifyPassword`, `requireAuth`).

## Concerns

None.