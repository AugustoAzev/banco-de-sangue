# Apresentação do Sistema — Banco de Sangue

## Descrição

O **Banco de Sangue** é uma aplicação web para gestão de hemocentros. Ele permite cadastrar doadores de sangue, controlar o estoque de bolsas de sangue (por tipo sanguíneo), gerenciar insumos/materiais hospitalares e acompanhar estatísticas de coleta. O sistema é voltado para equipes administrativas de hemocentros, com controle de acesso por autenticação JWT.

## Arquitetura Resumida

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)              │
│  React 19 + TypeScript + Axios + Lucide Icons        │
├─────────────────────────────────────────────────────┤
│         Pages Router API (/pages/api/*)                │
│  auth/login  donors/  inventory/bolsas  insumos/     │
├─────────────────────────────────────────────────────┤
│               Supabase (PostgreSQL)                  │
│  usuarios, doadores, doacoes, insumos              │
│  Autenticação via JWT + bcrypt                      │
└─────────────────────────────────────────────────────┘
```

**Camadas:**
- **UI (Frontend):** Next.js 15 App Router, páginas React com CSS modules
- **API (Backend):** Next.js API Routes (Pages Router) — validação, autenticação, comunicação com Supabase
- **Dados:** Supabase PostgreSQL — tabelas normalizadas com triggers para `atualizado_em`

## Como Executar

### Pré-requisitos
- Node.js 18+
- npm
- Conta no Supabase (projeto criado)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/AugustoAzev/banco-de-sangue.git
cd banco-de-sangue

# Instalar dependências
npm install

# Criar arquivo .env
# Copie .env.example para .env e preencha com suas chaves do Supabase
cp .env.example .env
```

### Variáveis de ambiente (.env)

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=uma_chave_secreta_minimo_32_caracteres
```

### Banco de dados

1. Criar projeto no [Supabase](https://supabase.com)
2. Executar o script `supabase_migration.sql` no SQL Editor do Supabase
3. O script cria as tabelas, triggers, índices e insere dados de exemplo

### Executar localmente

```bash
npm run dev
```

Acessar: http://localhost:3000

**Credenciais de teste:**
- Email: `admin@banco-sangue.com`
- Senha: `12345678`

### Build para produção

```bash
npm run build
npm start
```
