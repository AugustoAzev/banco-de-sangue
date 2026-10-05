# Checklist e Testes de Ponta a Ponta — TP4

> **TP4:** [README](../README.md) · [Relatório do TP4](../RELATORIO-TP4.md) · [Avaliação heurística](./redesign/avaliacao-heuristica.md) · [Melhorias do redesign](./redesign/melhorias-implementadas.md) · [Planejamento da evolução](./evolucao/planejamento.md) · [Acessibilidade](./evolucao/acessibilidade.md) · **Checklist e testes** · [CHANGELOG](../CHANGELOG.md) · [Pull Request #78](https://github.com/AugustoAzev/banco-de-sangue/pull/78)

**Data da execução:** 04/10/2026
**Resultado:** **46 de 46 verificações passaram** pela interface, mais **80 testes automatizados** (Jest), `tsc --noEmit` e `next build` sem erros.

## 1. Como foi testado

- **Sistema rodando localmente** a partir do build de produção (`npm run build && npm start -- -p 3100`), ligado ao **banco Supabase real do grupo**.
- **Navegador automatizado** (Playwright + Chromium) agindo como uma pessoa: clica, digita, usa Tab, Enter e Esc. Os testes de acessibilidade usam o axe-core (WCAG 2.1 A/AA).
- **Roteiro:** [`scripts/testar-tp4-e2e.mjs`](../scripts/testar-tp4-e2e.mjs).
- **Dados de teste:** tudo o que o roteiro cria leva o prefixo "E2E TP4" e é apagado no fim, inclusive se algum teste falhar.
  - **Isolamento das bolsas:** as bolsas de teste usam um tipo sanguíneo que estava **sem estoque** (AB−), para que as saídas não alterem bolsas reais.
  - **Conferido no banco depois da execução:** 13 doadores e 10 bolsas em estoque, igual ao início, e nenhum registro "E2E" restante.

## 2. Checklist do enunciado

| Requisito do enunciado | Onde está | Verificado por | Situação |
|---|---|---|---|
| **Etapa 1** — Avaliação heurística das 10 heurísticas de Nielsen, com pontos fortes e fracos, capturas e prioridade | [avaliacao-heuristica.md](./redesign/avaliacao-heuristica.md) | revisão do documento (17 problemas, severidade e prioridade) | ✅ |
| **Etapa 1** — Melhorias de interface implementadas a partir da avaliação | código + [melhorias-implementadas.md](./redesign/melhorias-implementadas.md) | testes C1–C7, C10 e C11 (as validações de quantidade e as confirmações com o nome do item também são cobertas em D1, G7, F3 e G5) | ✅ |
| **Etapa 1** — Antes e depois, com a heurística de cada mudança | [melhorias-implementadas.md](./redesign/melhorias-implementadas.md) (M01–M10 com capturas) | revisão do documento | ✅ |
| **Etapa 2** — Duas funcionalidades novas, definidas e justificadas num documento de planejamento | [planejamento.md](./evolucao/planejamento.md) | revisão do documento | ✅ |
| **Etapa 2** — Funcionalidades integradas e funcionando | saída de bolsas e busca de doadores | testes D1–D6 e E1–E4, no banco real | ✅ |
| **Etapa 2** — Pelo menos uma melhoria de acessibilidade, corrigindo limitação real | [acessibilidade.md](./evolucao/acessibilidade.md) | testes F1a–F1d, F2–F6, F8 e F9 (axe sem violações, teclado, leitor de tela), mais B2 e G1 (avisos de erro e de sucesso) | ✅ |
| **Etapa 2** — Justificativa (problema, impacto para pessoas com deficiência, solução) no mesmo diretório do planejamento | [`docs/evolucao/`](./evolucao/) | revisão do documento | ✅ |
| **Etapa 2** — Documentado no README e no CHANGELOG | [README](../README.md), [CHANGELOG](../CHANGELOG.md) | links conferidos (nenhum quebrado) | ✅ |
| Versionamento | versão 1.2.0, commits separados por etapa, [PR #78](https://github.com/AugustoAzev/banco-de-sangue/pull/78) | histórico do Git | ✅ |
| Cada etapa com documentação própria e separada | [`docs/redesign/`](./redesign/) e [`docs/evolucao/`](./evolucao/) | estrutura do repositório | ✅ |
| Entrega: link do repositório no Google Classroom | — | depende do merge do PR #78 no `master` | ⏳ pendente |

## 3. Resultado dos testes pela interface

### Etapa 1 — Redesign (9/9)

| ID | O que foi verificado | Área | Resultado | Observado |
|---|---|---|---|---|
| C1 | Números do painel batem com as telas de estoque, doadores e insumos | Redesign (M01 · H1) | ✅ passou | bolsas 10, menor AB- (0), 7 tipos abaixo do mínimo, 13 doadores, 0 insumos baixos |
| C2 | Os 4 cards do painel são links que levam à tela certa | Redesign (M01 · H4) | ✅ passou | todos navegam |
| C3 | Estoque lista os 8 tipos, sem "ID Lote", com situação coerente | Redesign (M02 · H1/H2) | ✅ passou | Tipo Sanguíneo / Bolsas Disponíveis / Última Entrada / Situação / Ações |
| C4 | Registro do sistema protegido na tela e na API (409) | Redesign (M03 · H5) | ✅ passou | PUT/DELETE/anonymize → 409/409/409 |
| C5 | Erro de CPF aparece junto do campo, recebe o foco e continua após 8 s | Redesign (M04 · H9) + A11y (3.3.1) | ✅ passou | O CPF deve ter 11 dígitos (foram informados 3). |
| C6 | Formulários padronizados: botão do cabeçalho some, "Cancelar" fecha e devolve o foco | Redesign (M05 · H4) | ✅ passou | doadores, estoque e insumos |
| C7 | Todo botão de ícone tem dica (title) | Redesign (M06 · H6) | ✅ passou |  |
| C10 | Perfil exibido como "Administrador" (não o enum) | Redesign (M09 · H2) | ✅ passou |  |
| C11 | Dicas de preenchimento visíveis (450 mL, mínimo, limite de insumos, CEP) | Redesign (M10 · H10) | ✅ passou |  |

### Etapa 2 — Funcionalidade 1 (saída de bolsas) (6/6)

| ID | O que foi verificado | Área | Resultado | Observado |
|---|---|---|---|---|
| D1 | Entrada de bolsas em AB- (tipo sem estoque) atualiza tabela e painel | Funcionalidade 1 — saída | ✅ passou | AB-: 0 → 3 (Adequado); painel 10 → 13; campos vazios recusados |
| D2 | Saída pela linha da tabela já vem com o tipo e o foco na quantidade | Funcionalidade 1 — saída | ✅ passou | axe sem violações no formulário de saída |
| D3 | Mais bolsas do que o estoque é bloqueado sem gravar nada | Funcionalidade 1 — saída | ✅ passou | Há apenas 3 bolsa(s) de AB- em estoque. · API → 400 (Há apenas 3 bolsa(s) de AB- em estoque) |
| D4 | Despacho com destino: confirmação, estoque −1 e a bolsa MAIS ANTIGA sai | Funcionalidade 1 — saída | ✅ passou | saiu a bolsa da primeira entrada (FIFO); destino gravado |
| D5 | Descarte exige motivo; com motivo, estoque −1 | Funcionalidade 1 — saída | ✅ passou | API sem motivo → 400 (Informe o motivo do descarte) |
| D6 | Histórico mostra entrada, despacho e descarte (estoque e painel), mesmo após recarregar | Funcionalidade 1 — saída | ✅ passou | estoque, recarregado e painel; ?limite=2 respeitado |

### Etapa 2 — Funcionalidade 2 (busca de doadores) (4/4)

| ID | O que foi verificado | Área | Resultado | Observado |
|---|---|---|---|---|
| E1 | Nome sem diferenciar acento e maiúsculas | Funcionalidade 2 — busca | ✅ passou | "JOÃO" → Joao Carlos Pereira |
| E2 | CPF parcial com e sem máscara encontra o mesmo doador | Funcionalidade 2 — busca | ✅ passou | "986224" e "986.224" → E2E TP4 Teste 862249 Mouse Editado |
| E3 | Filtro por tipo sanguíneo e por situação; contagem "X de Y" | Funcionalidade 2 — busca | ✅ passou | O+: 4 de 15 doadores encontrados; anonimizados: 1 |
| E4 | Sem resultado: mensagem, "Limpar busca" restaura a lista e devolve o foco | Funcionalidade 2 — busca | ✅ passou |  |

### Etapa 2 — Acessibilidade (11/11)

| ID | O que foi verificado | Área | Resultado | Observado |
|---|---|---|---|---|
| F1a | Login sem violações WCAG A/AA (axe) | Acessibilidade | ✅ passou |  |
| F1b | Doadores com busca ativa e formulário aberto sem violações (axe) | Acessibilidade | ✅ passou |  |
| F1c | Insumos com formulário aberto sem violações (axe) | Acessibilidade | ✅ passou |  |
| F1d | Painel, estoque (com formulário de entrada) e diálogo aberto sem violações (axe) | Acessibilidade | ✅ passou |  |
| F2 | Primeiro Tab é "Pular para o conteúdo"; Enter + Tab chega ao botão principal | Acessibilidade (2.4.1) | ✅ passou | 3 teclas |
| F3 | Diálogo: foco no "Cancelar", Tab preso, Esc fecha e devolve o foco ao botão | Acessibilidade (2.4.3 / 2.1.2) | ✅ passou | confirmação cita o nome do doador |
| F4 | Todos os campos dos formulários e filtros têm rótulo associado | Acessibilidade (1.3.1 / 3.3.2) | ✅ passou | doador, busca, estoque (filtro e entrada) e insumo |
| F5 | Botões de ação anunciam a ação e o nome do item | Acessibilidade (4.1.2) | ✅ passou | editar, anonimizar e excluir |
| F6 | Cada tela tem título próprio na aba | Acessibilidade (2.4.2) | ✅ passou | Painel Geral — Banco de Sangue / Doadores — Banco de Sangue / Estoque de Sangue — Banco de Sangue / Insumos — Banco de Sangue |
| F8 | Cadastro completo de doador usando só o teclado | Acessibilidade (2.1.1) | ✅ passou | gravado com sexo, tipo e idade escolhidos pelo teclado |
| F9 | Ao trocar de tela pelo menu (Enter), o próximo Tab já vai para o conteúdo, não para o resto do menu | Acessibilidade (2.4.3) | ✅ passou | Tab seguinte: "Novo Doador" |

### Regressão — áreas vizinhas que poderiam quebrar (16/16)

| ID | O que foi verificado | Área | Resultado | Observado |
|---|---|---|---|---|
| B1 | Rota protegida sem sessão redireciona para o login | Regressão — login | ✅ passou |  |
| B2 | Senha errada mostra erro e o aviso de erro não some sozinho (9 s) | Regressão — login | ✅ passou | mensagem continua visível após 9 s |
| B3 | API recusa acesso sem token (401) | Regressão — API | ✅ passou | 401, 401, 401, 401 |
| B4 | Login válido leva ao painel | Regressão — login | ✅ passou |  |
| B5 | Encerrar sessão volta ao login e bloqueia as telas | Regressão — login | ✅ passou |  |
| G1 | Cadastro válido aparece na lista com CPF formatado; aviso de sucesso some sozinho | Regressão — doadores | ✅ passou |  |
| G2 | CPF duplicado (mesmo número com máscara) é recusado junto do campo | Regressão — doadores | ✅ passou | CPF já cadastrado |
| G3 | Edição salva o nome; a API recusa idade fora da faixa (PUT) | Regressão — doadores | ✅ passou | PUT idade 70 → 400 (idade deve ser um número inteiro entre 16 e 69 anos) |
| G4 | CEP válido preenche o endereço (ViaCEP real); inexistente mostra aviso | Regressão — CEP (TP3) | ✅ passou | Avenida Paulista, Bela Vista, São Paulo - SP |
| G5 | Anonimizar remove dados pessoais e mantém o registro | Regressão — LGPD (TP3) | ✅ passou | nome trocado, CPF removido, registro mantido |
| G6 | Excluir doador sem doações (pela tela e pela API) | Regressão — doadores | ✅ passou | tela: removido; API (anonimizado): 204 |
| G7 | Criar, sinalizar baixo estoque no painel, editar, validar negativo e excluir | Regressão — insumos | ✅ passou | painel 0 → 1; -3 recusado; 50 → Normal; excluído |
| G8 | Filtro por tipo e "Excluir lote" continuam funcionando | Regressão — estoque | ✅ passou | AB- voltou a 0 (Sem estoque) |
| G10 | Celular (390 px): sem rolagem horizontal da página em nenhuma tela | Regressão — layout | ✅ passou | /dashboard 390px, /doadores 390px, /estoque 390px, /insumos 390px |
| G11 | Nenhum erro de JavaScript no console durante todo o roteiro | Regressão — estabilidade | ✅ passou |  |
| G12 | Notebook com zoom (1280 px): cards do painel com a mesma altura, tabelas sem estourar e "Ações" alinhado como as demais colunas | Regressão — layout | ✅ passou | cards 217px, /doadores 928/928px, /estoque 928/928px, /insumos 928/928px |

## 4. Defeitos que os testes encontraram e que foram corrigidos

A primeira execução teve 38 de 44 aprovações. Das 6 falhas, **2 eram defeitos reais** do TP4, corrigidos antes da execução final. As outras 4 eram do próprio roteiro: ele conferia a lista antes de ela recarregar, e uma falha em cascata deixou a janela no tamanho de celular.

| Teste | Defeito | Causa | Correção |
|---|---|---|---|
| F6 | O título da aba não mudava por tela: ficava sempre "Banco de Sangue" | O título era trocado por código na tela, mas o Next.js reescreve o título a partir dos metadados | Cada rota declara o título nos metadados ([`app/layout.tsx`](../app/layout.tsx) com template e um `layout.tsx` por tela, como [o do painel](../app/(protected)/dashboard/layout.tsx)) |
| G10 | No celular (390 px), Doadores e Estoque ficavam com 509 px de largura | Os textos só para leitor de tela dentro das tabelas (tipo sanguíneo por extenso) ficavam posicionados fora da área que rola | O contêiner da tabela passou a conter esses textos (`position: relative` em `.table-container`, em [`app/globals.css`](../app/globals.css)) |

Os dois só apareceram no teste pela interface. As capturas e a nota do Lighthouse não pegavam nenhum deles.

### Ajustes da revisão do grupo no navegador

Usando o sistema num notebook com zoom de 150% (área útil de cerca de 1280 px), o grupo encontrou ajustes que as capturas, feitas em 1366 px, não mostravam. Todos foram corrigidos e viraram verificações automáticas.

| Achado | Causa | Correção | Verificação |
|---|---|---|---|
| O card "Bolsas em Estoque" ficava mais alto que os outros três | A descrição quebrava em duas linhas, e o card não acompanhava a altura da linha do grid | Os cards ocupam a altura toda da linha ([`app/globals.css`](../app/globals.css)) | G12 |
| A tabela de Doadores ficava mais larga que a tela, cortando a coluna Ações | "Usado nas entradas de estoque" e os nomes longos não podiam quebrar linha | Esses textos quebram em até duas linhas | G12 |
| O título "Ações" ficava alinhado à direita, diferente das demais colunas | Alinhamento à direita definido na própria tela | Título e botões alinhados à esquerda nas três tabelas | G12 |
| Depois de trocar de tela clicando no menu, o Tab continuava percorrendo o menu | O foco ficava no link clicado | Ao trocar de tela, o foco vai para o conteúdo ([`app/(protected)/layout.tsx`](../app/(protected)/layout.tsx)) | F9 |

## 5. Achado fora do escopo do TP4 (já existia antes)

- **Não há como encerrar a sessão no celular.** Em telas de até 760 px, o bloco com o nome do usuário e o botão "Encerrar Sessão" é ocultado (`.app-user { display: none; }`), regra que já existia antes do TP4. No computador funciona (teste B5). Não foi alterado porque não fazia parte das mudanças planejadas; fica registrado como próximo passo (heurística H3, controle e liberdade do usuário).

## 6. Testes automatizados complementares

| Verificação | Resultado |
|---|---|
| `npx jest` (unidade e API) | 9 suítes, **80 testes** passando (eram 33 antes do TP4) |
| `npx tsc --noEmit` | sem erros |
| `npm run build` | compila sem erros |
| Links dos documentos do TP4 (renderizados pela API do GitHub) | nenhum link quebrado |

## 7. Como rodar de novo

```bash
npm run build && npm start -- -p 3100           # terminal 1
npm install --no-save axe-core@4                 # terminal 2
node scripts/testar-tp4-e2e.mjs e2e-saida        # gera e2e-saida/resultado-e2e.json
```

O roteiro precisa do `.env` com as chaves do Supabase, para a limpeza e a conferência das bolsas. Ele cria e apaga os próprios dados de teste.
