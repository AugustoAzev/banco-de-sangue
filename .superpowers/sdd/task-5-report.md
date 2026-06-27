# Task 5 Report: Employees e Health

## Status: DONE

## Files Created

- `api/employees/index.ts` — GET + POST handler
- `api/health.ts` — GET handler

## Commit

```
e31cf39 feat(api): add employees endpoints and health check
```

## What Was Implemented

### `api/employees/index.ts`

**GET /api/employees**
- Requires auth via `requireAuth()`
- Optional `?query=` filter searches `nome_completo` and `cargo` via Supabase `or=` filter
- Selects: `id_usuario, nome_completo, cargo, cpf, pis, telefone, email, tipo, criado_em`
- Ordered by `nome_completo.asc`

**POST /api/employees**
- Requires auth via `requireAuth()`
- Validates required fields: `name`, `email`, `password`
- Checks CPF duplicate via Supabase query before INSERT (if CPF provided)
- Hashes password with `bcryptjs` via `hashPassword()`
- Generates UUID via `crypto.randomUUID()`
- Uses service role (`getServiceHeaders()`) for INSERT
- Always creates as `ATENDENTE` tipo
- Returns 201 with created record

### `api/health.ts`

**GET /api/health**
- No auth required
- Returns `{ status: 'ok' }`

## TypeScript

- No errors in the new files
- Pre-existing errors in other files (inventory, src/) were not introduced by this task

## Test Summary

- Pattern matches existing donors endpoint structure
- Auth flow consistent with other endpoints
- CPF duplicate check mirrors FastAPI backend behavior
- Health endpoint is minimal and correct

## Concerns

None.
