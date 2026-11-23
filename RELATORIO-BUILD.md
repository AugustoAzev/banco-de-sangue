# Relatório: gerenciamento do build e automação

**Disciplina:** Manutenção e Integração de Software
**Sistema:** Banco de Sangue (Next.js 15, React 19, TypeScript, Supabase)
**Tema:** Gerenciamento do processo de construção (Build) e automação (Maven, Gradle, npm)
**Versão:** 1.3.0 ([CHANGELOG](./CHANGELOG.md)) · **Pull Request:** [#87](https://github.com/AugustoAzev/banco-de-sangue/pull/87)
**Relatórios anteriores:** [TP3](./RELATORIO.md) · [TP4](./RELATORIO-TP4.md) · [TP5](./RELATORIO-TP5.md)

## Objetivo

Deixar o build do sistema **reproduzível e automatizado**: um comando valida tudo em qualquer máquina, o CI testa de verdade a cada mudança, e cada versão vira um pacote instalável publicado sem passo manual. Como o projeto é JavaScript, a ferramenta é o **npm**; o relatório mostra como cada fase do **Maven** e cada tarefa do **Gradle** foi montada com ele.

## Onde está cada coisa

| Conteúdo | Documento ou implementação | Evidência |
|---|---|---|
| Detalhamento: conceitos, Maven × Gradle × npm, diagnóstico, mudanças e resultados | [`docs/automacao-build/README.md`](./docs/automacao-build/README.md) | [`evidencias/antes/`](./docs/automacao-build/evidencias/antes/) e [`evidencias/depois/`](./docs/automacao-build/evidencias/depois/) |
| Ciclo de vida (scripts npm e versão do Node) | [`package.json`](./package.json), [`.nvmrc`](./.nvmrc) | [`02-npm-run-verify.txt`](./docs/automacao-build/evidencias/depois/02-npm-run-verify.txt) |
| Lint (fase validate) | [`eslint.config.mjs`](./eslint.config.mjs) | [antes](./docs/automacao-build/evidencias/antes/01-npm-run-lint.txt) |
| Checagem de tipos (fase compile) | [`tsconfig.json`](./tsconfig.json) | [antes](./docs/automacao-build/evidencias/antes/02-tsc.txt) |
| Fase package e gancho `postbuild` | [`scripts/empacotar-build.mjs`](./scripts/empacotar-build.mjs), [`scripts/preparar-standalone.mjs`](./scripts/preparar-standalone.mjs), [`next.config.js`](./next.config.js) | [`03-npm-run-package.txt`](./docs/automacao-build/evidencias/depois/03-npm-run-package.txt) |
| Testes E2E | [`playwright.config.ts`](./playwright.config.ts), [`tests/login.spec.js`](./tests/login.spec.js), [`tests/dashboard.spec.js`](./tests/dashboard.spec.js) | [`04-e2e-no-pacote.txt`](./docs/automacao-build/evidencias/depois/04-e2e-no-pacote.txt) |
| Pipeline de CI | [`.github/workflows/homologacao.yaml`](./.github/workflows/homologacao.yaml) | [execuções do PR #87](https://github.com/AugustoAzev/banco-de-sangue/pull/87/checks) |
| Release automatizada | [`.github/workflows/release.yaml`](./.github/workflows/release.yaml) | publicada ao criar a tag `v1.3.0` |
| Dependências | [`package-lock.json`](./package-lock.json), [`.github/dependabot.yml`](./.github/dependabot.yml) | [`06-npm-audit.txt`](./docs/automacao-build/evidencias/antes/06-npm-audit.txt) |
| Comparativo executável: a mesma regra em npm, Maven e Gradle | [`comparativo-maven-gradle/`](./comparativo-maven-gradle/README.md), [`pom.xml`](./comparativo-maven-gradle/pom.xml), [`build.gradle.kts`](./comparativo-maven-gradle/build.gradle.kts) | [workflow do comparativo](./.github/workflows/comparativo-maven-gradle.yaml) |
| Histórico de versões | [`CHANGELOG.md`](./CHANGELOG.md) | — |

## Maven, Gradle e npm, lado a lado

| Fase Maven | Tarefa Gradle | Script npm |
|---|---|---|
| validate | check | `npm run lint` |
| compile | compileJava | `npm run typecheck` |
| test | test | `npm run test:unit` |
| package | assemble | `npm run build` + `postbuild` + `npm run package` |
| verify | build | `npm run verify` |
| integration-test | integrationTest | `npm run test:e2e` |
| deploy | publish | tag `v*.*.*` → workflow de release |

O `pom.xml` e o `build.gradle` correspondem ao `package.json`; a trava de versões (`gradle.lockfile`) corresponde ao `package-lock.json` com `npm ci`; o `.jar` corresponde ao pacote `.tar.gz` com o servidor standalone do Next. A diferença que mais pesou: o Maven impõe o ciclo de vida, e o npm não impõe nenhum. Faltava justamente o ciclo.

Para não ficar só na tabela, o [comparativo executável](./comparativo-maven-gradle/README.md) constrói a regra de idade do doador com as três ferramentas e os mesmos casos de teste: `npm test`, `mvn verify` e `gradle build` rodam lado a lado num workflow próprio, e o Maven e o Gradle geram cada um o seu `.jar`.

## O que foi encontrado e o que mudou

| Problema encontrado | O que mudou |
|---|---|
| CI vermelho desde 03/11: `ubuntu-latest` virou 26.04 e o Playwright não instala nele | Sistema fixado em `ubuntu-24.04`, Node lido do `.nvmrc`, ações atualizadas |
| CI aprovava com teste falhando (`\|\| echo`) e nunca rodava o Jest | Jobs `verify` (lint, tipos, 82 testes, build, pacote) e `e2e` sem atalhos |
| `npm test` falhava com 0 testes; E2E apontavam para `localhost:5173` | `npm test` roda o Jest; Playwright configurado e specs reescritos |
| `npm run lint` travava numa pergunta | ESLint 9: 0 erros, 7 avisos documentados |
| Checagem de tipos ignorava as 14 rotas da API | `tsconfig.json` inclui `pages/`: 14 de 14 |
| 10 falhas de segurança nas dependências de produção, 1 crítica | 2 restantes, que dependem do Next 16 |
| Segredos do banco e do JWT no `vercel.json` público | Removidos; gitleaks em todo PR; troca das chaves pendente com a equipe |
| Nenhum artefato do build | Pacote `.tar.gz` em todo push e Release a cada tag |

## Validação

- Do zero (sem `node_modules` nem `.next`): `npm ci` e `npm run verify` aprovados em 91 s, com 82 testes ([saída](./docs/automacao-build/evidencias/depois/02-npm-run-verify.txt)).
- `npm run package` gerou `banco-de-sangue-1.3.0.tar.gz` (17,5 MB) sem o `.env` ([saída](./docs/automacao-build/evidencias/depois/03-npm-run-package.txt)).
- O pacote foi extraído em outra pasta, iniciado com `node server.js` e testado pelo Playwright: 5 de 5 aprovados ([saída](./docs/automacao-build/evidencias/depois/04-e2e-no-pacote.txt)), e 20 de 20 em quatro repetições seguidas.

## Commits

| Parte | Commit |
|---|---|
| Ciclo de vida em npm, lint, tipos, dependências e pacote | [`build(npm): ciclo de vida do build em scripts, ESLint 9, tipos nas rotas e pacote standalone`](https://github.com/AugustoAzev/banco-de-sangue/commit/e8b203f22145f8b31ba39e0c8bec68dced69c437) |
| Testes E2E | [`test(e2e): configurar Playwright contra o servidor de produção e atualizar specs`](https://github.com/AugustoAzev/banco-de-sangue/commit/8d441442d3a45598cb2b6d9cf20b1b2731a850d0) |
| Pipeline de CI e release | [`ci: pipeline de build e testes reproduzível e release automatizada`](https://github.com/AugustoAzev/banco-de-sangue/commit/36dc8ee28234c619ad571e40c906797bcd156231) |
| Segredos | [`fix(security): remover JWT_SECRET e chaves do Supabase do vercel.json`](https://github.com/AugustoAzev/banco-de-sangue/commit/a773c18e5af66d928e0a594848cf13931c5f692b) |
| Documentação | [`docs(build): relatório de build e automação, evidências e versão 1.3.0`](https://github.com/AugustoAzev/banco-de-sangue/commit/657a52da90287b43ce6d33505435f82750a3becd) |

## Pendências

1. **Trocar as chaves expostas** (service role key e JWT secret no Supabase, `JWT_SECRET` na Vercel e nos `.env`). Elas continuam no histórico do git.
2. **Cadastrar os segredos do E2E** no repositório (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`), senão o job de E2E é pulado com aviso.
3. **Confirmar as variáveis no painel da Vercel** antes do merge.
4. Avaliar o Next 16 numa manutenção própria (fecha as 2 falhas restantes) e corrigir os 7 avisos de lint com teste de regressão.

## Reflexão

O build "funcionava" para quem rodava `npm run dev` na própria máquina, e era isso que escondia os problemas. O CI estava verde por meses sem testar nada, e quando ficou vermelho foi por uma mudança do GitHub, não do nosso código. A lição é que automação só tem valor quando falha alto: um pipeline que sempre passa não protege nada. O outro aprendizado foi que gerenciar o build também é gerenciar dependências e segredos. Metade dos problemas encontrados não estava no código, estava no que o projeto puxa de fora e no que deixou escapar para dentro do repositório.
