# Task 6: Limpeza — remover código Python e configs obsoletas

**Files to delete:**
- `backend/` (entire folder)
- `alembic/` (entire folder)
- `prisma/` (entire folder)
- `seed_data.py`
- `seed_user.py`
- `backup_completo.sql`
- `alembic.ini`

**Files to modify:**
- `vite.config.ts` — remove the `proxy` section (keep `plugins` and `server.port`)
- `.gitignore` — remove entries related to Python/Alembic (`backend/venv/`, `__pycache__/`, `*.py[cod]`, `backend/.env`, `alembic/__pycache__/`)
- `package.json` — remove `prisma` and `@prisma/client` from dependencies

**Note:** Keep `supabase_migration.sql` — it was already moved to the root and is the reference for the Supabase schema.

**Commit message:**
```
refactor!: remove backend Python, alembic, prisma — чисто Node.js

Agora o projeto é 100% TypeScript/React + Vercel API Routes
conectando ao Supabase via PostgREST.

Co-Authored-By: Bruno Souza <brunosouza-alt@users.noreply.github.com>
```

**Project:** banco-de-sangue — converting FastAPI backend to Vercel API Routes (Node.js/TypeScript)
**Worktree:** C:\Users\bruno\OneDrive\Desktop\banco-de-sangue\.worktrees\feature-ajustes-gerais
**Branch:** feature/ajustes-gerais

**Report file:** .superpowers/sdd/task-6-report.md
