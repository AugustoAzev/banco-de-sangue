# Diagnóstico — Manutenção Preventiva

## Problema identificado

As regras de elegibilidade de doadores estavam distribuídas entre a API e a interface. A API continha os limites de idade (`16` e `69`) e a mensagem de validação, enquanto a tela de doadores mantinha textos próprios para a idade e o prazo de vacinação contra gripe (`48h`).

O sistema funciona corretamente no estado atual, mas essa duplicação aumenta o risco de divergência caso uma regra seja alterada em apenas um dos locais.

## Localização e estado atual

| Local | Responsabilidade |
| --- | --- |
| `pages/api/donors/index.ts` | Valida a idade recebida no cadastro. |
| `app/(protected)/doadores/page.tsx` | Exibe os critérios de triagem ao usuário. |
| `src/lib/types.ts` | Define os campos persistidos de triagem. |

## Mudança futura de referência

Uma atualização regulatória plausível reduziria a idade máxima de doação de 69 para 65 anos e ampliaria o prazo após vacina contra gripe de 48 para 72 horas.

Na estrutura anterior, essa mudança exigiria revisar a API, os textos da interface e os testes. O maior risco é permitir uma idade no servidor enquanto a tela informa outro limite.

## Intervenção preventiva

Foi criado o módulo `src/lib/donor-eligibility.ts`, que concentra os limites de idade, o prazo de vacinação, os textos de triagem e a função de validação de idade. A API, a interface e os testes passam a consumir essa mesma definição.

Essa decisão aplica ocultamento de informação e reduz o acoplamento entre consumidores da regra e seus valores internos.

## Evidência de melhoria

| Indicador | Antes | Depois |
| --- | --- | --- |
| Fonte oficial de regras | Distribuída em API e interface | `donor-eligibility.ts` |
| Pontos de produção para revisar uma regra | Dois ou mais | Um |
| Risco de divergência entre API e tela | Maior | Reduzido |
