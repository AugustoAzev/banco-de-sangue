# Relatório Final — Manutenção Corretiva

**Disciplina:** Manutenção e Integração de Software
**Instituição:** Universidade Federal do Amazonas — ICET

---

## 1. Descrição do Sistema

O **Banco de Sangue** é uma aplicação web para gestão de hemocentros. Permite cadastrar doadores de sangue, controlar o estoque de bolsas por tipo sanguíneo, gerenciar insumos e acompanhar estatísticas de coleta. Detalhes completos em [apresentacao-sistema.md](./apresentacao-sistema.md).

## 2. Resumo dos Bugs Identificados

| # | Tipo | Severidade | Local | Branch de fix |
|---|------|------------|-------|---------------|
| 1 | Lógico | Alta | `pages/api/inventory/bolsas.ts` | `fix/issue-1-bolsa-id-zero` |
| 2 | Segurança | Alta | `pages/api/donors/index.ts` | `fix/issue-2-cpf-duplicado-bypass` |
| 3 | Lógico / Runtime | Média | `pages/api/inventory/bolsas.ts` | `fix/issue-3-tipo-sanguineo-sem-validacao` |

Detalhes completos de cada bug em [bugs-e-classificacao.md](./bugs-e-classificacao.md).

## 3. Issues e PRs (quando criados no GitHub)

Quando esses artefatos forem criados no GitHub, esta seção conterá os links:

- **Issue #1:** Bolsas agrupadas retornam `id: 0`, impedindo exclusão
  - Documentação local: [docs/issues/issue-1-bolsa-id-zero.md](./issues/issue-1-bolsa-id-zero.md)
  - Branch de fix: `fix/issue-1-bolsa-id-zero`
  - PR: `fix(bolsas): preservar id real das bolsas no agrupamento (fixes #1)`

- **Issue #2:** Validação de CPF duplicado é ignorada em caso de erro de rede
  - Documentação local: [docs/issues/issue-2-cpf-duplicado-bypass.md](./issues/issue-2-cpf-duplicado-bypass.md)
  - Branch de fix: `fix/issue-2-cpf-duplicado-bypass`
  - PR: `fix(donors): bloquear cadastro se verificação de CPF falhar (fixes #2)`

- **Issue #3:** POST `/bolsas` não valida `tipo_sanguineo` contra valores do ENUM
  - Documentação local: [docs/issues/issue-3-tipo-sanguineo-sem-validacao.md](./issues/issue-3-tipo-sanguineo-sem-validacao.md)
  - Branch de fix: `fix/issue-3-tipo-sanguineo-sem-validacao`
  - PR: `fix(bolsas): validar tipo_sanguineo contra valores do ENUM (fixes #3)`

## 4. Evidências de Validação

Cada bug corrigido possui teste de regressão automatizado:

| Bug | Arquivo de teste | Cenários cobertos |
|-----|------------------|-------------------|
| #1 | `tests/api-bolsas.test.ts` | Agrupamento com múltiplos tipos, lista vazia, filtro |
| #2 | `tests/api-donors.test.ts` | CPF duplicado, falha de rede, CPF único |
| #3 | `tests/api-bolsas-post.test.ts` | Tipo inválido, todos os 8 válidos, quantidade, ausente |

**Execução dos testes:**

```bash
$ npx jest

PASS tests/api-bolsas.test.ts
PASS tests/api-bolsas-post.test.ts
PASS tests/api-donors.test.ts

Tests:       9 passed, 9 total
Test Suites: 3 passed, 3 total
```

## 5. Estrutura do Trabalho no Repositório

```
banco-de-sangue/
├── docs/
│   ├── apresentacao-sistema.md       # Etapa 1
│   ├── bugs-e-classificacao.md       # Etapa 2
│   ├── relatorio-final.md            # Etapa 7 (este arquivo)
│   └── issues/                       # Etapa 3 (pré-registro)
│       ├── issue-1-bolsa-id-zero.md
│       ├── issue-2-cpf-duplicado-bypass.md
│       └── issue-3-tipo-sanguineo-sem-validacao.md
├── .github/
│   └── ISSUE_TEMPLATE/
│       └── bug_report.md             # Etapa 3 (template)
├── tests/
│   ├── api-bolsas.test.ts            # Regressão #1
│   ├── api-donors.test.ts            # Regressão #2
│   └── api-bolsas-post.test.ts       # Regressão #3
└── (código-fonte sem alteração de estrutura)
```

## 6. Fluxo de Triagem Aplicado

Cada bug passou pelas seguintes etapas:

1. **Open:** Identificação inicial via code review
2. **Confirmed:** Documentação em `docs/issues/issue-N-*.md` com passos, evidências e classificação
3. **In Progress:** Branch criada a partir de `master`, correção implementada
4. **Closed (esperado após merge):** PR com `fixes #N` fecha a issue automaticamente

## 7. Retrabalho

Não houve retrabalho nesta execução: cada branch foi corrigida em um único commit (ou dois commits no caso de pequenas correções de teste), e os testes de regressão passaram na primeira tentativa após correções pontuais.

## 8. Ferramentas de Apoio Utilizadas

- **Code review manual:** identificação dos 3 bugs via leitura do código-fonte
- **Jest + ts-jest:** framework de testes para regressão
- **Dependabot:** considerado para varredura de dependências vulneráveis (recomenda-se ativar em Settings → Security → Code security and analysis no GitHub)

---

**Conclusão:** O fluxo completo de manutenção corretiva foi aplicado — identificação, classificação, documentação, correção, testes de regressão e estruturação do trabalho seguindo as boas práticas do TP. Cada bug é rastreável via branch, commit, e documentação local que simula as issues do GitHub.
