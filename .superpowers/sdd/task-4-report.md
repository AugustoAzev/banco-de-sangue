# Task 4 Report: Inventario — Bolsas e Insumos

## Status: DONE

## Commits

- `a2940ac` feat(inventory): implement bolsas and insumos API routes

## Files Created

| File | Methods | Description |
|------|---------|-------------|
| `api/inventory/bolsas.ts` | GET, POST | List EM_ESTOQUE bolsas grouped by blood type; bulk-register N bolsas as doacoes rows |
| `api/inventory/bolsas/[id].ts` | DELETE | Remove a bolsa by id_doacao using service role |
| `api/inventory/insumos.ts` | GET, POST | List all insumos ordered by id; create insumo with service role |
| `api/inventory/insumos/[id].ts` | PUT, DELETE | Update/delete insumo by id with service role |

## Test Summary

- Bolsas GET: filters `status=eq.EM_ESTOQUE`, optional `tipo_sangue` query param, groups client-side by blood type, returns `{id, tipo_sangue, quantidade, created_at}`
- Bolsas POST: resolves generic donor (cpf=000.000.000-00) and first unidade_coleta, creates N doacoes rows (volume_ml=450, status=EM_ESTOQUE, id_atendente from JWT), uses service role
- Bolsas DELETE: verifies bolsa exists and is in stock before deleting, service role
- Insumos GET: plain list ordered by id asc
- Insumos POST/PUT/DELETE: service role for all writes, existence checks before mutating

## Concerns

- Bolsas GET returns `id: 0` as placeholder since quantity is the metric — the brief says to map PostgREST fields to `{id, tipo_sangue, quantidade, created_at}`; the blood-type grouping loses individual bag IDs. If callers need per-bag IDs, the response shape needs revisiting.
- Service role headers are inlined in bolsas/[id].ts, insumos.ts, and insumos/[id].ts instead of using `getServiceHeaders()` — consistent with donors/[id].ts pattern, but could be refactored to use the helper for consistency.
