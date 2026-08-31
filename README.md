# Banco de Sangue

Sistema de gestão de hemocentros para cadastro de doadores, controle de estoque de sangue e administração de insumos.

---

## Tecnologias

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Estilização:** CSS Modules / CSS Nativo
- **Ícones:** Lucide React
- **HTTP Client:** Axios
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** JWT (via API Routes)
- **Deploy:** Vercel
- **Testes:** Playwright

---

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase (projeto criado)

---

## Instalação

```bash
git clone https://github.com/seu-usuario/banco-de-sangue.git
cd banco-de-sangue
npm install
```

## Variáveis de Ambiente

Criar `.env` na raiz do projeto:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT
JWT_SECRET=uma_chave_secreta_minimo_32_caracteres
```

## Banco de Dados

Criar o banco no Supabase e rodar o script de migração:

```sql
-- Cole o conteúdo de supabase_migration.sql no SQL Editor do Supabase
```

## Executar Localmente

```bash
npm run dev
```

Acessar: http://localhost:3000

---

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Login |
| `/dashboard` | Painel com estatísticas |
| `/doadores` | Gestão de doadores |
| `/estoque` | Controle de estoque de sangue |
| `/insumos` | Administração de insumos |

---

## Testes (Playwright)

```bash
npx playwright test
npx playwright show-report
```

---

## Deploy na Vercel

1. Conectar o repositório GitHub na [Vercel](https://vercel.com)
2. Adicionar as variáveis de ambiente na Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
3. Fazer deploy

---

## Estrutura

```
banco-de-sangue/
├── app/                    # Next.js App Router
│   ├── (protected)/         # Rotas autenticadas
│   │   ├── dashboard/
│   │   ├── doadores/
│   │   ├── estoque/
│   │   └── insumos/
│   └── page.tsx             # Login
├── api/                     # API Routes (App Router)
│   ├── auth/
│   ├── donors/
│   └── inventory/
├── src/
│   ├── contexts/            # React Context (Auth)
│   ├── lib/                 # Supabase helpers, types, auth
│   └── services/            # Axios API client
├── pages/api/               # API Routes legadas
├── tests/                   # Playwright
├── supabase_migration.sql   # Schema do banco
└── package.json
```

---

## Licença

MIT
