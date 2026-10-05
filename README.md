# Banco de Sangue

Sistema de gestão de hemocentros para cadastro de doadores, controle de estoque de sangue e administração de insumos.

> **TP4 — Redesign e Manutenção Evolutiva (versão 1.2.0):** o objetivo que atravessa o trabalho é que **qualquer profissional do hemocentro consiga operar o sistema**, inclusive quem tem baixa visão, usa só o teclado ou usa leitor de tela.
> - **Comece por aqui:** [`RELATORIO-TP4.md`](./RELATORIO-TP4.md), com a síntese das duas etapas, o mapa de onde está cada documento e cada evidência, os números e a reflexão crítica.
> - **Etapa 1 — Redesign:** [avaliação heurística (Nielsen)](./docs/redesign/avaliacao-heuristica.md) e [melhorias com antes/depois](./docs/redesign/melhorias-implementadas.md).
> - **Etapa 2 — Evolução:** [planejamento das funcionalidades](./docs/evolucao/planejamento.md) (saída de bolsas com histórico e busca de doadores) e [melhoria de acessibilidade](./docs/evolucao/acessibilidade.md) (Lighthouse 90–96 → 100).
> - **Capturas de tela** (cada pasta tem um README com a descrição de cada imagem): [antes do TP4](./docs/redesign/screenshots/antes/) → [depois do redesign](./docs/redesign/screenshots/depois-do-redesign/) → [estado final do sistema](./docs/evolucao/screenshots/estado-final/), e a demonstração das [funcionalidades novas](./docs/evolucao/screenshots/funcionalidades/).
> - **Medições brutas:** [Lighthouse, axe e teclado nos três estados, e o resultado dos testes](./docs/evolucao/evidencias/), geradas por [`scripts/capturar-evidencias.mjs`](./scripts/capturar-evidencias.mjs) e [`scripts/testar-tp4-e2e.mjs`](./scripts/testar-tp4-e2e.mjs).
> - **Testes:** [checklist do enunciado e 46 testes pela interface](./docs/checklist-testes-tp4.md), todos aprovados no sistema rodando com o banco real.
> - **Versionamento:** histórico em [`CHANGELOG.md`](./CHANGELOG.md); todas as mudanças do TP4 estão no [Pull Request #78](https://github.com/AugustoAzev/banco-de-sangue/pull/78).
>
> **TP3 — Manutenção Adaptativa:** três adaptações (mudança de dependência, mudança de regulamentação LGPD e integração de API externa). Síntese em [`RELATORIO.md`](./RELATORIO.md), detalhes e evidências em [`manutencao-adaptativa/`](./manutencao-adaptativa/).

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
| `/dashboard` | Painel: total de doadores e de bolsas, menor estoque, insumos em baixo estoque, avisos de tipos abaixo do mínimo e movimentações recentes |
| `/doadores` | Gestão de doadores: cadastro com triagem e consentimento LGPD, edição, anonimização e **busca** por nome/CPF, tipo sanguíneo e situação |
| `/estoque` | Estoque de sangue por tipo: **entrada**, **saída (despacho ou descarte)**, situação em relação ao estoque mínimo e histórico de movimentações |
| `/insumos` | Administração de insumos e materiais |

## Funcionalidades adicionadas no TP4

| Funcionalidade | Rotas da API | Documentação |
|---|---|---|
| Saída de bolsas (despacho/descarte) com histórico | [`POST /api/inventory/saidas`](./pages/api/inventory/saidas.ts), [`GET /api/inventory/movimentacoes`](./pages/api/inventory/movimentacoes.ts) | [planejamento](./docs/evolucao/planejamento.md#2-funcionalidade-1--registro-de-saída-de-bolsas-despacho-e-descarte) |
| Busca de doadores | — (feita na tela, sobre [`GET /api/donors`](./pages/api/donors/index.ts)) | [planejamento](./docs/evolucao/planejamento.md#3-funcionalidade-2--busca-de-doadores) |

Nenhuma das duas exige mudança no banco: elas usam os status `DESPACHADA` e `DESCARTADA`, que o schema já previa.

## Acessibilidade

O sistema segue a **WCAG 2.1 nível AA**:

- **Teclado:** todas as telas podem ser operadas só pelo teclado, e o link "Pular para o conteúdo principal" é o primeiro item no Tab.
- **Leitor de tela:** botões de ícone com nome acessível que inclui o item afetado, e campos com rótulo e erro associados.
- **Diálogos:** os diálogos de confirmação controlam o foco.
- **Contraste:** o texto tem contraste mínimo de 4,5:1.

Para medir de novo (Lighthouse e axe-core):

```bash
npm run build && npm start -- -p 3100        # em outro terminal
npm install --no-save lighthouse@12 axe-core@4
node scripts/capturar-evidencias.mjs depois docs/evolucao/screenshots/estado-final docs/evolucao/evidencias
```

Detalhes e roteiro de verificação manual: [`docs/evolucao/acessibilidade.md`](./docs/evolucao/acessibilidade.md).

---

## Testes

```bash
npx jest                 # testes de unidade e de API (80 testes)
npx playwright test      # E2E (requer o sistema rodando)
npx playwright show-report

# TP4: 46 verificações pela interface contra o sistema rodando (cria e apaga os próprios dados)
npm install --no-save axe-core@4
node scripts/testar-tp4-e2e.mjs e2e-saida
```

Resultado e checklist do TP4: [`docs/checklist-testes-tp4.md`](./docs/checklist-testes-tp4.md).

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
├── app/                     # Next.js App Router (telas)
│   ├── (protected)/          # Rotas autenticadas
│   │   ├── _components/      # Componentes compartilhados (histórico de movimentações)
│   │   ├── dashboard/
│   │   ├── doadores/
│   │   ├── estoque/
│   │   └── insumos/
│   ├── globals.css
│   └── page.tsx              # Login
├── pages/api/                # API Routes (Pages Router)
│   ├── auth/                 # login, me
│   ├── cep/[cep]             # Proxy para ViaCEP (TP3)
│   ├── donors/               # CRUD + [id]/anonymize (LGPD, TP3)
│   └── inventory/            # bolsas, insumos, saidas e movimentacoes (TP4)
├── src/
│   ├── contexts/             # Auth e avisos/diálogo de confirmação
│   ├── hooks/                # use-focus-target (gestão de foco, TP4)
│   ├── lib/                  # Regras de negócio e helpers (elegibilidade, política de estoque,
│   │                         #   tipos sanguíneos, busca, movimentações, Supabase, auth)
│   └── services/             # Cliente Axios
├── tests/                    # Jest (unidade/API) + Playwright (E2E)
├── scripts/                  # capturar-evidencias.mjs (prints, axe, Lighthouse — TP4)
├── docs/
│   ├── redesign/             # TP4 Etapa 1: avaliação heurística e melhorias
│   └── evolucao/             # TP4 Etapa 2: planejamento, acessibilidade e evidências
├── manutencao-adaptativa/    # Evidências e plano do TP3
├── supabase_migration.sql    # Schema do banco
├── CHANGELOG.md              # Histórico de versões
├── RELATORIO.md              # Síntese das adaptações (TP3)
└── package.json
```

---

## Licença

MIT
