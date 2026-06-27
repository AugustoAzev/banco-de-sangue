# Task 1 Report: Setup — Dependências e tipagem base

## Status: DONE

## Summary

Successfully created the foundation for the Node.js/TypeScript backend on top of the existing Vite+React project. The API routes directory structure is in place with shared utilities for Supabase PostgREST communication, JWT authentication, and bcrypt password handling.

## What Was Done

### 1. Dependencies Added to package.json
- Added `bcryptjs` (^2.4.3) and `jsonwebtoken` (^9.0.2) to dependencies
- Added `@types/bcryptjs` (^2.4.6) and `@types/jsonwebtoken` (^9.0.7) to devDependencies
- Added `next` (^15.3.0) to dependencies to enable API routes
- Added `react` (^19.1.0) and `react-dom` (^19.1.0) to resolve Next.js peer dependencies

### 2. npm install Executed
- Successfully installed 167 packages

### 3. Files Created

| File | Description |
|------|-------------|
| `api/_lib/types.ts` | Shared TypeScript interfaces: `User`, `TokenPayload`, `ApiError`, `LoginRequest`, `LoginResponse`, `Doador`, `DoadorCreate`, `Bolsa`, `BolsaCreate`, `Insumo`, `InsumoCreate` |
| `api/_lib/supabase.ts` | PostgREST fetch wrapper with `supabaseFetch()`, `getServiceHeaders()`, `getSupabaseHeaders()`, `unauthorized()`, `badRequest()`, `notFound()`, `internalError()` |
| `api/_lib/auth.ts` | JWT and bcrypt helpers: `signToken()`, `verifyToken()`, `hashPassword()`, `verifyPassword()` |
| `api/_middleware/auth.ts` | Auth middleware: `getTokenFromRequest()`, `requireAuth()` |

### 4. Config Files Updated
- `tsconfig.json`: Added `api` to the `include` array
- `next.config.js`: Created with `serverComponentsExternalPackages: ['bcryptjs']` for server-side compatibility

### 5. Commits Created

| SHA | Subject |
|-----|---------|
| `f543799` | feat: setup base — types, supabase client, JWT helpers, auth middleware |

## Export Summary

All required exports from the brief are present:
- **types.ts**: `User`, `TokenPayload`, `ApiError`, `LoginRequest`, `LoginResponse`, `Doador`, `DoadorCreate`, `Bolsa`, `BolsaCreate`, `Insumo`, `InsumoCreate`
- **supabase.ts**: `supabaseFetch()`, `getServiceHeaders()`, `getSupabaseHeaders()`, `unauthorized()`, `badRequest()`, `notFound()`, `internalError()`
- **auth.ts**: `signToken()`, `verifyToken()`, `hashPassword()`, `verifyPassword()`
- **_middleware/auth.ts**: `getTokenFromRequest()`, `requireAuth()`

## Type Checking

TypeScript compilation of API files passes cleanly. Pre-existing errors in the `src/` frontend directory are unrelated to this task.

## Concerns

1. **Pre-existing frontend errors**: The `src/` directory has TypeScript errors (unused imports, missing JSX namespace) that are unrelated to this task but will need attention before a full build.

2. **bcryptjs compatibility**: Uses `bcrypt.compare()` which is compatible with `$2b$12$...` hashes from Python's bcrypt.

3. **Environment variables required**: The following must be configured in Vercel:
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
