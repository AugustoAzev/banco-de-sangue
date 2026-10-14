# Relatório Final — TP5: Refatoração

**Disciplina:** Manutenção e Integração de Software  
**Sistema:** Banco de Sangue  
**Branch:** `tp5-reclassificacao-fowler`

## Objetivo

Reorganizar a estrutura interna do módulo de estoque por meio de quatro técnicas do catálogo de refatorações de Martin Fowler, preservando o comportamento das rotas, as regras de negócio e os contratos existentes. As mudanças também foram classificadas pela intenção: de Compreensão, Preparatória, Planejada e de Longo Prazo.

## Onde está cada coisa

| Conteúdo | Documento | Implementação | Validação |
|---|---|---|---|
| Relatório detalhado das quatro refatorações, problemas, justificativas e evidências | [`refatoracao/relatorio.md`](./refatoracao/relatorio.md) | — | — |
| De compreensão — Extract Function — agrupamento de bolsas | [`refatoracao/relatorio.md`](./refatoracao/relatorio.md#1-de-compreensão--extrair-o-agrupamento-de-bolsas-da-rota) | [`groupBagsByType`](./src/lib/inventory-policy.ts) | [`api-bolsas.test.ts`](./tests/api-bolsas.test.ts) |
| Preparatória — Replace Magic Number with Symbolic Constant — volume padrão | [`refatoracao/relatorio.md`](./refatoracao/relatorio.md#2-preparatória--substituir-o-literal-do-volume-pela-constante-da-política) | [`INVENTORY_POLICY`](./src/lib/inventory-policy.ts) | [`api-bolsas.test.ts`](./tests/api-bolsas.test.ts) |
| Planejada — Replace Loop with Pipeline — movimentações | [`refatoracao/relatorio.md`](./refatoracao/relatorio.md#3-planejada--substituir-o-laço-por-um-pipeline) | [`buildMovements`](./src/lib/stock-movements.ts) | [`evolucao-saidas-movimentacoes.test.ts`](./tests/evolucao-saidas-movimentacoes.test.ts) |
| De longo prazo — Introduce Parameter Object — dados de uma movimentação | [`refatoracao/relatorio.md`](./refatoracao/relatorio.md#4-de-longo-prazo--introduzir-objeto-parâmetro-para-uma-movimentação) | [`MovementInput`](./src/lib/stock-movements.ts) | [`evolucao-saidas-movimentacoes.test.ts`](./tests/evolucao-saidas-movimentacoes.test.ts) |

## Justificativa da escolha

As quatro técnicas foram escolhidas porque tratam problemas concretos do estoque e têm baixo risco funcional. A primeira é de compreensão, pois separa uma regra pura e reduz a complexidade da rota; a segunda é preparatória, pois elimina uma fonte divergente antes de mudanças futuras; a terceira foi planejada para reorganizar o fluxo de processamento em etapas explícitas; e a quarta é de longo prazo, pois estabelece um objeto estável para evoluções. Assim, o código fica mais legível e preparado para mudanças futuras sem alterar o contrato das APIs.

## Validação

- Suíte completa: `npm exec -- jest --runInBand` — 9 suítes e 82 testes aprovados.
- Tipagem: `npx tsc --noEmit` — aprovada.
- Build: `npm run build` — concluído com sucesso.

## Conclusão

O TP5 entrega quatro refatorações diferentes, documentadas com o problema original, a solução aplicada, a justificativa da escolha e a evidência de validação. A organização segue o padrão do TP4: este arquivo funciona como entrada principal e o relatório detalhado mantém os exemplos completos.
