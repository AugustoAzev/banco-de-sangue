# Medições brutas — TP4

> Parte do TP4 · [Relatório do TP4](../../../RELATORIO-TP4.md) · [Acessibilidade](../acessibilidade.md) · [Checklist e testes](../../checklist-testes-tp4.md)

Saídas dos roteiros automáticos, sem edição. Os números dos documentos do TP4 vêm daqui.

| Arquivo | Estado do sistema | Gerado por | Usado em |
|---|---|---|---|
| [`relatorio-antes.json`](./relatorio-antes.json) | Original, antes do TP4 (commit `014e608`) | [`scripts/capturar-evidencias.mjs`](../../../scripts/capturar-evidencias.mjs) | [avaliação heurística §4](../../redesign/avaliacao-heuristica.md#4-achados-de-acessibilidade-base-para-a-etapa-2), [acessibilidade §1 e §4](../acessibilidade.md#4-evidências) |
| [`relatorio-pos-redesign.json`](./relatorio-pos-redesign.json) | Depois da Etapa 1, antes da Etapa 2 | [`scripts/capturar-evidencias.mjs`](../../../scripts/capturar-evidencias.mjs) | [melhorias do redesign](../../redesign/melhorias-implementadas.md#evidências-quantitativas), [acessibilidade §4](../acessibilidade.md#4-evidências) |
| [`relatorio-depois.json`](./relatorio-depois.json) | Estado final, fim do TP4 | [`scripts/capturar-evidencias.mjs`](../../../scripts/capturar-evidencias.mjs) | [acessibilidade §4](../acessibilidade.md#4-evidências) |
| [`resultado-e2e.json`](./resultado-e2e.json) | Estado final, 46 verificações pela interface | [`scripts/testar-tp4-e2e.mjs`](../../../scripts/testar-tp4-e2e.mjs) | [checklist e testes](../../checklist-testes-tp4.md) |

**O que tem em cada relatório de captura:**

- **`lighthouse`:** nota de acessibilidade (0–100) e auditorias que falharam, por tela.
- **`paginas.*.axe`:** violações WCAG 2.1 A/AA encontradas pelo axe-core, com a quantidade de elementos afetados e exemplos.
- **`paginas.*.ariaMain` e `ariaForm`:** a árvore de acessibilidade da tela, que é o que o leitor de tela recebe. Comparando antes e depois, dá para ver, por exemplo, `button` virar `button "Excluir doador Maria Oliveira Santos"`.
- **`teclado`:**
  - quantos Tabs até o botão principal;
  - o nome da primeira ação da tabela;
  - para onde o foco vai ao abrir e ao fechar o diálogo;
  - o primeiro elemento no Tab.

**Em [`resultado-e2e.json`](./resultado-e2e.json):**

- o resultado de cada verificação (`ok`, `detail`);
- o tipo sanguíneo usado para as bolsas de teste;
- o relatório da limpeza dos dados de teste;
- os erros de console (nenhum).
