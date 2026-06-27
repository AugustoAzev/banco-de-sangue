# Task 7: Configurar variáveis de ambiente no Vercel

**Files to create/modify:**
- Create: `vercel.json` — with env var placeholders
- Modify: `.env.example` — update with Supabase + JWT vars

**vercel.json content:**
```json
{
  "env": {
    "JWT_SECRET": "@jwt-secret",
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  },
  "buildCommand": "npm run build",
  "devCommand": "npm run dev"
}
```

**.env.example content:**
```
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT
JWT_SECRET=uma_chave_secreta_minimo_32_caracteres
```

**Commit message:**
```
chore: add vercel.json e atualizar .env.example

Co-Authored-By: Bruno Souza <brunosouza-alt@users.noreply.github.com>
```

**Project:** banco-de-sangue — converting FastAPI backend to Vercel API Routes (Node.js/TypeScript)
**Worktree:** C:\Users\bruno\OneDrive\Desktop\banco-de-sangue\.worktrees\feature-ajustes-gerais
**Branch:** feature/ajustes-gerais

**Report file:** .superpowers/sdd/task-7-report.md
