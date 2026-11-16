# Changelog

Mudanças relevantes do sistema Banco de Sangue. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento segue o [SemVer](https://semver.org/lang/pt-BR/).

## [1.3.0] — 2026-11-15 — Build e automação

Documentação: [`RELATORIO-BUILD.md`](./RELATORIO-BUILD.md) e [`docs/automacao-build/`](./docs/automacao-build/).

### Adicionado

- **Ciclo de vida do build em scripts npm:** `lint`, `typecheck`, `test:unit`, `test:e2e`, `build` (com o gancho `postbuild`), `verify` e `package`. `npm run verify` valida tudo com um comando.
- **Pacote instalável:** `npm run package` gera `dist/banco-de-sangue-<versão>.tar.gz` com o servidor standalone do Next.js e um `BUILD-INFO.json`. O `.env` nunca entra no pacote.
- **Release automatizada** ([`release.yaml`](./.github/workflows/release.yaml)): uma tag `v*.*.*` valida, empacota e publica a Release no GitHub com as notas deste arquivo.
- **Busca de segredos (gitleaks)** em todo pull request.
- **Configuração do Playwright** ([`playwright.config.ts`](./playwright.config.ts)), que sobe o servidor de produção sozinho.
- **Versão do Node fixada:** `engines` no `package.json` e [`.nvmrc`](./.nvmrc) (Node 22).

### Alterado

- **CI reescrito** ([`homologacao.yaml`](./.github/workflows/homologacao.yaml)):
  - jobs `verify` (lint, tipos, 82 testes, build e pacote) e `e2e`;
  - sistema fixado em `ubuntu-24.04` e Node lido do `.nvmrc`;
  - ações atualizadas, cache do npm e do Next.js;
  - o pacote fica disponível como artifact.
- **`npm test` roda o Jest**; os testes E2E passaram para `npm run test:e2e`.
- **Lint pelo ESLint 9** ([`eslint.config.mjs`](./eslint.config.mjs)) no lugar do `next lint`, que foi descontinuado.
- **`npm start` roda o servidor standalone** (`node .next/standalone/server.js`).
- **Testes E2E de login e painel** reescritos para a interface atual.
- **Next.js 15.5.19 → 15.5.29** e dependências indiretas atualizadas: as falhas de segurança nas dependências de produção caíram de 10 (1 crítica) para 2.
- **Refatoração estrutural do estoque** (TP5, [PR #81](https://github.com/AugustoAzev/banco-de-sangue/pull/81)), sem mudança de comportamento.

### Removido

- **`react-router-dom`**, dependência sem uso.
- **Segredos do `vercel.json`** (`JWT_SECRET` e chaves do Supabase). As chaves continuam no histórico do git e precisam ser trocadas.

### Corrigido

- **CI vermelho desde 03/11/2026:** o `ubuntu-latest` passou a ser 26.04, onde o Playwright não instala.
- **CI que aprovava com teste falhando:** o `|| echo` foi removido.
- **Checagem de tipos sem as rotas da API:** o `tsconfig.json` não incluía `pages/`.
- **Erros de API nas telas** tratados com o auxiliar tipado `apiErrorDetail` em vez de `any`.

## [1.2.0] — 2026-10-04 — TP4: Redesign e Manutenção Evolutiva

Documentação: [`docs/redesign/`](./docs/redesign/) (Etapa 1) e [`docs/evolucao/`](./docs/evolucao/) (Etapa 2).

### Adicionado

- **Registro de saída de bolsas, por despacho ou descarte.** A saída muda o status da bolsa em vez de apagar o registro. As bolsas mais antigas do tipo saem primeiro, e o motivo é obrigatório no descarte. Novas rotas: [`POST /api/inventory/saidas`](./pages/api/inventory/saidas.ts) e [`GET /api/inventory/movimentacoes`](./pages/api/inventory/movimentacoes.ts).
- **Histórico de movimentações** (entradas, despachos e descartes) no painel e na tela de estoque. Substitui o card "Movimentações Recentes", que era um texto fixo.
- **Busca de doadores** por nome (sem diferenciar acentos) ou CPF (com ou sem máscara), tipo sanguíneo e situação (ativo ou anonimizado).
- **Política de estoque** ([`src/lib/inventory-policy.ts`](./src/lib/inventory-policy.ts)): estoque mínimo de 3 bolsas por tipo e limite de baixo estoque de insumos, definidos num só lugar.
- **Card "Insumos em Baixo Estoque"** no painel.
- **Roteiro de evidências** [`scripts/capturar-evidencias.mjs`](./scripts/capturar-evidencias.mjs): capturas de tela, axe-core e Lighthouse.
- **Testes de ponta a ponta** [`scripts/testar-tp4-e2e.mjs`](./scripts/testar-tp4-e2e.mjs): 46 verificações pela interface, contra o sistema rodando e o banco real ([resultado](./docs/checklist-testes-tp4.md)).
- **47 testes automatizados novos**: de 33 para 80.

### Alterado

- **Painel:** "Bolsas em Estoque" soma as bolsas. "Menor Estoque" mostra o tipo e a quantidade. Os avisos listam todos os tipos abaixo do mínimo, e só aparecem quando há algum.
- **Estoque:** a tabela mostra os 8 tipos sanguíneos, inclusive os sem estoque, com a situação de cada um (Adequado, Abaixo do mínimo ou Sem estoque). Saiu a coluna "ID Lote".
- **Formulários padronizados nas três telas:** título, botão de fechar, ação principal e "Cancelar".
- **Erros junto do campo:** no cadastro de doador, o erro aparece junto do campo e fica até a correção.
- **Confirmações específicas:** citam o item afetado e explicam a consequência.
- **Rótulo único de tipo sanguíneo** em todas as telas.
- **Perfil legível:** o perfil do usuário aparece como "Administrador" ou "Atendente".
- **Layout em telas menores ou com zoom** (ajustes da revisão do grupo): os cards do painel ficam com a mesma altura; nomes longos e o aviso da coluna Ações quebram em duas linhas em vez de alargar a tabela; o título "Ações" e os botões ficam alinhados à esquerda, como as demais colunas.

### Corrigido

- **Total de bolsas do painel:** contava os tipos sanguíneos em vez das bolsas (6 em vez de 9).
- **Aviso de estoque crítico:** era emitido sem existir nível de segurança definido.
- **Card "Coletas Hoje":** parecia um link, não levava a lugar nenhum e era calculado sobre os grupos.
- **Doador genérico das entradas de estoque:** podia ser editado, anonimizado ou excluído, o que quebrava o registro de novas bolsas. Agora é protegido na tela e na API (`409`).
- **Quantidades inválidas:** a quantidade negativa de insumo e a quantidade vazia no estoque (`NaN`) passaram a ser recusadas.

### Acessibilidade (WCAG 2.1 AA)

- **Leitor de tela:**
  - nome acessível com contexto em todos os botões de ícone;
  - rótulos ligados a todos os campos;
  - erros ligados ao campo (`aria-invalid`, `aria-describedby`);
  - tabelas com legenda e cabeçalhos;
  - tipo sanguíneo lido por extenso.
- **Teclado:**
  - diálogo de confirmação com foco no "Cancelar", Tab preso no diálogo e foco devolvido ao fechar;
  - foco gerenciado ao abrir e fechar formulários;
  - link "Pular para o conteúdo principal";
  - indicador de foco visível.
- **Contraste:** o texto secundário passou de 4,34:1 para 5,18:1 e as descrições, de 2,54:1 para 5,73:1.
- **Avisos e animações:** os avisos de erro não somem sozinhos, e as animações respeitam a opção "reduzir movimento".
- **Títulos de página:** cada tela tem título próprio.
- **Troca de tela pelo menu:** o foco vai para o conteúdo da nova tela, e o próximo Tab não percorre o menu de novo.
- **Resultado medido:** Lighthouse de 90–96 para **100** nas 5 telas; axe-core sem violações.

## [1.1.0] — 2026-09-21 — TP3: Manutenção Adaptativa

Documentação: [`manutencao-adaptativa/`](./manutencao-adaptativa/) e [`RELATORIO.md`](./RELATORIO.md). Versão não marcada com tag na época; registrada aqui retroativamente.

### Adicionado

- **Consentimento LGPD** obrigatório e datado no cadastro de doador.
- **Anonimização de doador** ([`PATCH /api/donors/{id}/anonymize`](./pages/api/donors/[id]/anonymize.ts)), que preserva o histórico de doações.
- **Integração com o ViaCEP** ([`GET /api/cep/{cep}`](./pages/api/cep/[cep].ts)) para preencher o endereço do doador.

### Alterado

- **TypeScript fixado em `5.9.3`:** a versão 7 quebra o `ts-jest` e o `next build`.
- **Regras de elegibilidade de doadores centralizadas** em [`src/lib/donor-eligibility.ts`](./src/lib/donor-eligibility.ts) (manutenção preventiva, 2026-09-09).

### Corrigido

- **Manutenção corretiva (2026-08-31):**
  - as bolsas agrupadas retornavam `id` 0;
  - a idade do doador era aceita sem validação;
  - o CPF aceitava emojis.
- **Ajustes após a avaliação do TP3 (2026-10-04):**
  - CPF normalizado;
  - `id_registrador` resolvido pelo e-mail;
  - "Excluir lote" passou a remover o lote inteiro;
  - nova tentativa automática em leituras com falha de rede.

## [1.0.0] — 2025-11-23

- **Primeira versão:** login com JWT, cadastro de doadores, estoque de bolsas por tipo sanguíneo, insumos e painel.

[1.3.0]: https://github.com/AugustoAzev/banco-de-sangue/compare/234840a...v1.3.0
[1.2.0]: https://github.com/AugustoAzev/banco-de-sangue/pull/78
[1.1.0]: https://github.com/AugustoAzev/banco-de-sangue/compare/release/1.0.0...014e608
[1.0.0]: https://github.com/AugustoAzev/banco-de-sangue/tree/release/1.0.0
