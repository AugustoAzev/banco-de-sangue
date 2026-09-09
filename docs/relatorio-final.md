# Relatório Final — Manutenção Preventiva

**Disciplina:** Manutenção e Integração de Software
**Sistema:** Banco de Sangue

## Situação encontrada

O cadastro de doadores já funcionava, mas a política de elegibilidade estava distribuída entre a API e a tela de cadastro. Os limites de idade estavam fixos no servidor, e os critérios de triagem eram mantidos como textos independentes na interface.

## Problema de manutenibilidade e mudança futura

Uma futura alteração regulatória plausível — idade máxima de 69 para 65 anos e prazo após vacina contra gripe de 48 para 72 horas — exigiria modificar mais de um ponto de produção. Isso poderia gerar divergência entre o que a interface informa e o que a API aplica.

O diagnóstico detalhado está em [diagnostico-manutencao-preventiva.md](./diagnostico-manutencao-preventiva.md).

## Intervenção realizada

Foi criado `src/lib/donor-eligibility.ts`, a fonte única para:

- idade mínima e máxima permitidas;
- prazo após vacina contra gripe;
- textos dos critérios de triagem;
- validação reutilizável de idade.

`pages/api/donors/index.ts` agora usa a função e a mensagem centralizadas. A tela `app/(protected)/doadores/page.tsx` usa os textos do mesmo módulo. O comportamento vigente foi preservado: idades de 16 a 69 anos são aceitas e os demais valores são rejeitados.

## Evidências e validação

- Testes de unidade: `tests/donor-eligibility.test.ts` cobre limites, valores inválidos, prazo de vacina, textos e mensagem de validação.
- Testes de regressão existentes: preservados.
- Build: concluído com sucesso após a alteração.
- Vídeo Antes: adicionar o link publicado na Issue #68.
- Vídeo Depois: adicionar o link publicado na Issue #68 após a demonstração final.

## Melhoria estrutural

| Indicador | Antes | Depois |
| --- | --- | --- |
| Fonte oficial das regras | API e interface | `src/lib/donor-eligibility.ts` |
| Pontos de produção para alterar uma regra | Dois ou mais | Um |
| Risco de divergência | Maior | Reduzido |

## Rastreabilidade

- Issue: [#68 — Centralizar regras de elegibilidade](https://github.com/AugustoAzev/banco-de-sangue/issues/68)
- Branch: `68-manutencao-preventiva-centralizar-regras-de-elegibilidade-de-doadores`
- Pull Request: adicionar o link após a abertura.

## Conclusão

Esta é uma manutenção preventiva porque elimina antecipadamente a duplicação das regras de triagem, antes de uma alteração regulatória real. A nova estrutura reduz o impacto de mudanças futuras e preserva o funcionamento atual do sistema.
