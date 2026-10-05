# Relatório Final — TP4: Redesign e Manutenção Evolutiva

**Sistema:** Banco de Sangue (gestão de hemocentro — Next.js 15, TypeScript, Supabase)
**Repositório:** https://github.com/AugustoAzev/banco-de-sangue
**Versão:** 1.2.0 ([CHANGELOG](./CHANGELOG.md)) · **Pull Request:** [#78](https://github.com/AugustoAzev/banco-de-sangue/pull/78)
**Relatório do TP3:** [`RELATORIO.md`](./RELATORIO.md)

## Objetivo

Evoluir o sistema em duas etapas, conforme o enunciado: um **redesign** guiado pelas 10 heurísticas de Nielsen e uma **manutenção evolutiva**, com duas funcionalidades novas e uma melhoria de acessibilidade.

O sistema é usado pela equipe do hemocentro. O objetivo que atravessa as duas etapas é que **qualquer profissional consiga operar o sistema**, inclusive quem tem baixa visão, usa só o teclado ou usa leitor de tela. Tudo foi feito como manutenção das telas existentes: nenhuma tela nova fora do escopo e nenhuma migration de banco.

## Onde está cada coisa

| Conteúdo | Documento | Evidências |
|---|---|---|
| **Etapa 1** — Avaliação heurística (Nielsen) | [`docs/redesign/avaliacao-heuristica.md`](./docs/redesign/avaliacao-heuristica.md) | [capturas antes](./docs/redesign/screenshots/antes/) |
| **Etapa 1** — Melhorias implementadas (antes e depois, com a heurística de cada uma) | [`docs/redesign/melhorias-implementadas.md`](./docs/redesign/melhorias-implementadas.md) | [capturas depois do redesign](./docs/redesign/screenshots/depois-do-redesign/) |
| **Etapa 2** — Planejamento das duas funcionalidades | [`docs/evolucao/planejamento.md`](./docs/evolucao/planejamento.md) | [capturas das funcionalidades](./docs/evolucao/screenshots/funcionalidades/) |
| **Etapa 2** — Melhoria de acessibilidade (justificativa e registro) | [`docs/evolucao/acessibilidade.md`](./docs/evolucao/acessibilidade.md) | [capturas do estado final](./docs/evolucao/screenshots/estado-final/) |
| Checklist do enunciado e testes pela interface | [`docs/checklist-testes-tp4.md`](./docs/checklist-testes-tp4.md) | [`resultado-e2e.json`](./docs/evolucao/evidencias/resultado-e2e.json) |
| Medições brutas (Lighthouse, axe, teclado) | [`docs/evolucao/evidencias/`](./docs/evolucao/evidencias/) | antes, após redesign, estado final |
| Roteiros que geram as evidências | [`scripts/capturar-evidencias.mjs`](./scripts/capturar-evidencias.mjs), [`scripts/testar-tp4-e2e.mjs`](./scripts/testar-tp4-e2e.mjs) | — |
| Histórico de versões | [`CHANGELOG.md`](./CHANGELOG.md) | — |

Cada pasta de capturas tem um README que explica cada imagem e aponta onde ela é discutida. As capturas têm os mesmos nomes nos três estados (antes → depois do redesign → estado final), para comparar lado a lado.

## Síntese da Etapa 1 — Redesign

**Avaliação:** as 10 heurísticas aplicadas às 5 telas e aos estados com interação. Foram **17 problemas**, cada um com severidade (escala de Nielsen), prioridade e impacto na acessibilidade. A avaliação mostrou que "deixar mais bonito" não era o problema principal: o painel **mostrava informação errada**.

- **"Bolsas em Estoque" errado:** o card mostrava 6 com 9 bolsas, porque contava os tipos sanguíneos em vez de somar as bolsas.
- **Aviso falso:** afirmava "abaixo do nível de segurança" sem existir nível definido.
- **Registro do sistema exposto:** o doador usado em toda entrada de estoque podia ser anonimizado pela tela, o que quebrava o registro de novas bolsas.

**Mudanças:** 10 melhorias (M01–M10), cada uma ligada à heurística que atende:

- painel com números corretos e estoque mínimo definido (H1);
- estoque mostrando os 8 tipos e a situação de cada um (H1/H2);
- registro do sistema protegido na tela e na API (H5);
- erros junto do campo, que só somem quando corrigidos (H9);
- formulários padronizados (H4);
- confirmações que dizem qual item será afetado (H3);
- dicas nos campos (H10).

| Painel — antes | Painel — depois do redesign |
|---|---|
| ![Painel antes](./docs/redesign/screenshots/antes/02-dashboard.png) | ![Painel depois do redesign](./docs/redesign/screenshots/depois-do-redesign/02-dashboard.png) |

## Síntese da Etapa 2 — Manutenção Evolutiva

### Funcionalidade 1 — Registro de saída de bolsas (despacho e descarte)

**Problema:** a única forma de tirar uma bolsa do estoque era excluí-la, o que apagava o registro e perdia a rastreabilidade exigida pela ANVISA. O banco já previa os status `DESPACHADA` e `DESCARTADA`, mas nenhuma tela os usava.

**Evolução:**

- a saída muda o status da bolsa, e as bolsas mais antigas do tipo saem primeiro;
- o motivo é obrigatório no descarte;
- o card "Movimentações Recentes", que era um texto fixo, passou a mostrar entradas e saídas reais;
- nenhuma migration é necessária.

**Evidência:** [capturas](./docs/evolucao/screenshots/funcionalidades/) da demonstração no banco real e os testes D1–D6 do [checklist](./docs/checklist-testes-tp4.md), que conferem no banco que a bolsa mais antiga é a que sai.

### Funcionalidade 2 — Busca de doadores

**Problema:** a lista de doadores não tinha busca nem filtro (heurística H7).

**Evolução:**

- busca por nome sem diferenciar acentos e por CPF com ou sem máscara;
- filtro por tipo sanguíneo e por situação;
- contagem anunciada ao leitor de tela.

**Evidência:** [capturas](./docs/evolucao/screenshots/funcionalidades/) e os testes E1–E4.

### Melhoria de acessibilidade — operação completa por teclado e leitor de tela

**Problema medido no sistema original:**

- 25 botões sem nome em Doadores e 18 em Insumos;
- campos sem rótulo;
- foco fora do diálogo de confirmação;
- nenhum atalho para o conteúdo;
- foco quase invisível;
- contraste abaixo de 4,5:1.

**Melhoria:**

- nomes acessíveis com o item afetado ("Excluir doador Maria…");
- rótulos e erros ligados aos campos;
- diálogo com foco gerenciado;
- atalho "Pular para o conteúdo";
- foco visível;
- contraste AA;
- título por tela.

| | Original | Após redesign | Estado final |
|---|---|---|---|
| Lighthouse (acessibilidade), menor nota entre as 5 telas | 90 | 92 | **100** |
| Elementos com violação WCAG (axe), tela de Doadores | 27 | 2 | **0** |
| Teclas até o botão principal | 6 | 6 | **3** |
| Foco ao abrir o diálogo | fora dele | fora dele | **dentro** |

Justificativa completa, com o impacto para cada grupo de pessoas com deficiência: [`acessibilidade.md`](./docs/evolucao/acessibilidade.md).

## Como o sistema ficou

| Painel | Estoque |
|---|---|
| ![Painel final](./docs/evolucao/screenshots/estado-final/02-dashboard.png) | ![Estoque final](./docs/evolucao/screenshots/estado-final/04-estoque.png) |

Todas as telas do estado final, inclusive no celular: [`docs/evolucao/screenshots/estado-final/`](./docs/evolucao/screenshots/estado-final/).

## Números

- **10** melhorias de redesign, ligadas a **17** problemas da avaliação heurística.
- **2** funcionalidades novas e **11** itens de acessibilidade (WCAG 2.1 AA).
- **80** testes automatizados (eram 33) e **46** verificações de ponta a ponta pela interface, todos passando.
- **0** violações WCAG A/AA no estado final; nota **100** no Lighthouse nas 5 telas.
- **0** links quebrados na documentação do TP4.

## Commits

| Etapa | Commit |
|---|---|
| Etapa 1 — código | [`feat(redesign): aplicar heuristicas de Nielsen nas telas existentes`](https://github.com/AugustoAzev/banco-de-sangue/commit/40ab87d4cdf9233c702df28bbbfff06d7dc1eadd) |
| Etapa 1 — documentação | [`docs(redesign): avaliacao heuristica e melhorias com antes/depois`](https://github.com/AugustoAzev/banco-de-sangue/commit/bcd77e52b9ade9a83de2fbc78e277ac53bc84279) |
| Etapa 2 — funcionalidades | [`feat(evolucao): saida de bolsas com historico e busca de doadores`](https://github.com/AugustoAzev/banco-de-sangue/commit/8127f27b6a07844533f978b33884f6eb0ed6631a) |
| Etapa 2 — acessibilidade | [`feat(a11y): operacao completa por teclado e leitor de tela`](https://github.com/AugustoAzev/banco-de-sangue/commit/421bcbdb3715d8cd23a7bcfb004517eecc7ff9eb) |
| Etapa 2 — documentação | [`docs(evolucao): planejamento das funcionalidades e melhoria de acessibilidade`](https://github.com/AugustoAzev/banco-de-sangue/commit/9dd80b3b86ec919f8cdde782f0e0689ef02a8347) |
| Correções encontradas nos testes | [`fix(a11y): titulo de pagina por metadados e largura correta no celular`](https://github.com/AugustoAzev/banco-de-sangue/commit/95c13c4) |
| Ajustes da revisão do grupo (zoom e foco na troca de tela) | [`fix(ui): ajustes da revisao do grupo em telas com zoom e foco ao trocar de tela`](https://github.com/AugustoAzev/banco-de-sangue/commit/af306d0) |
| Testes de ponta a ponta | [`test(tp4): 44 verificacoes de ponta a ponta pela interface`](https://github.com/AugustoAzev/banco-de-sangue/commit/4631a1f) |

Histórico completo: [Pull Request #78](https://github.com/AugustoAzev/banco-de-sangue/pull/78/commits).

## Reflexão crítica

O ponto mais importante do redesign foi que **a avaliação heurística encontrou defeitos, não só problemas de estética**. A heurística H1 (visibilidade do status do sistema) levou a conferir os números do painel contra a tela de estoque. Foi aí que apareceu a soma errada, que já existia no sistema antes do TP4. Um redesign só visual teria deixado o painel mais bonito e igualmente errado.

Na Etapa 2, tratar acessibilidade como objetivo do TP inteiro, e não como um item isolado, mudou a forma de construir as funcionalidades: elas já nasceram com rótulos, nomes e foco corretos, então não precisaram de retrabalho. O mesmo princípio de "manutenção, não reescrita" guiou as decisões técnicas. A saída de bolsas usa os status que o banco já tinha em vez de criar tabelas, e a busca usa a lista que a tela já carregava.

Por fim, os **testes de ponta a ponta pela interface pegaram dois defeitos que as métricas automáticas não pegaram**, apesar da nota 100 no Lighthouse:

- o título da aba nunca mudava por tela;
- no celular, a página ficava mais larga que a tela.

Os dois foram corrigidos. A revisão do grupo usando o sistema num notebook com zoom ainda encontrou ajustes de layout e de foco que nenhum teste cobria; eles foram corrigidos e viraram verificações automáticas. Ferramentas automáticas de acessibilidade medem só parte do problema: verificar o comportamento real, do jeito que uma pessoa usaria, continua indispensável. A validação com um usuário real de leitor de tela fica como próximo passo ([limitações](./docs/evolucao/acessibilidade.md#6-limitações)).
