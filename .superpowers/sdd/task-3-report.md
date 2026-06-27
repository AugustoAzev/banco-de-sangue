# Task 3 Report: Doadores CRUD

## Status: DONE

## Commits Created

- `04e5faa` — feat: doadores CRUD — GET/POST list+create and PUT/DELETE update+delete

## Files Created

- `api/donors/index.ts` — GET (list with optional query filter) + POST (create with triagem validation + CPF duplicate check)
- `api/donors/[id].ts` — PUT (update donor fields) + DELETE (check linked donations before deletion)

## Implementation Details

**`api/donors/index.ts`:**
- `GET`: Uses `requireAuth`, builds PostgREST query with optional `?query=` filter searching `nome_completo.ilike` and `cpf.ilike`, orders by nome_completo asc.
- `POST`: Validates required fields (nome, cpf, tipo_sanguineo, idade, sexo), validates triagem (condicao_1 && condicao_2 && condicao_3 must all be true), checks CPF duplicate via PostgREST SELECT, generates `id_doador` via `crypto.randomUUID()`, inserts with service role key, returns 201 with created record.

**`api/donors/[id].ts`:**
- `PUT`: Uses `requireAuth`, verifies donor exists via PostgREST SELECT, builds PATCH payload mapping `nome -> nome_completo` and other fields, updates with service role key.
- `DELETE`: Verifies donor exists, checks `doacoes` table for any `id_doador` match, returns 400 if donations exist, otherwise DELETE with service role key, returns 204.

## Test Summary

Both files compile correctly against the Task 1 foundation (types, supabaseFetch, requireAuth, getServiceHeaders). No runtime test was executed.

## Concerns

- The `DoadorCreate` type has `documento` and `cpf` as separate fields — the brief says "CPF duplicate check" and the original FastAPI likely used `cpf` field. The implementation uses `cpf` field consistently.
- No explicit schema validation for CPF format (e.g., 11-digit mask). This is acceptable since PostgREST / Supabase can enforce constraints at the DB level.
- No explicit unit tests. Integration testing against the deployed Supabase project would be needed to validate the full flow.
