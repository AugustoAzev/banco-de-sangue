# Relatório — Trabalho Prático 5: Refatoração

**Disciplina:** Manutenção e Integração de Software

**Sistema:** Banco de Sangue
**Branch:** `tp5-reclassificacao-fowler`

## Objetivo e restrição

O trabalho reorganiza a estrutura interna do estoque sem mudar o comportamento observado. Foram aplicadas quatro técnicas diferentes do catálogo de Martin Fowler: **Extract Function**, **Replace Magic Number with Symbolic Constant**, **Replace Loop with Pipeline** e **Introduce Parameter Object**. Além das técnicas, as mudanças foram classificadas conforme a intenção da refatoração: **Planejada**, **Preparatória**, **de Compreensão** e **de Longo Prazo**. A resposta das rotas e as regras de negócio foram mantidas.

## Critério para escolha

As refatorações foram escolhidas porque atacam problemas concretos encontrados no módulo de estoque e têm baixo risco funcional: extraem regras puras para teste, eliminam uma segunda fonte para o volume padrão e tornam o processamento de movimentações mais declarativo e coeso. Em conjunto, melhoram a legibilidade e reduzem o custo de futuras alterações sem alterar o contrato das rotas.

## Refatorações realizadas

### 1. Planejada — extrair o agrupamento de bolsas da rota

**Problema:** a rota `GET /api/inventory/bolsas` misturava acesso ao banco e transformação dos registros em grupos. A regra era difícil de testar sem executar a rota.

**Antes** (`pages/api/inventory/bolsas.ts`):

```ts
const grouped: Record<string, { id: string; tipo_sangue: string; created_at: string }[]> = {};
for (const row of rows) {
  if (!grouped[row.tipo_sanguineo_coletado]) grouped[row.tipo_sanguineo_coletado] = [];
  grouped[row.tipo_sanguineo_coletado].push({
    id: row.id_doacao,
    tipo_sangue: row.tipo_sanguineo_coletado,
    created_at: row.data_doacao,
  });
}
const result: Bolsa[] = Object.entries(grouped).map(([tipo_sangue, bolsas]) => ({
  id: bolsas[0]?.id ?? '',
  tipo_sangue,
  quantidade: bolsas.length,
  created_at: bolsas[0]?.created_at,
}));
```

**Depois:** a transformação pura foi extraída para [`groupBagsByType`](../src/lib/inventory-policy.ts), e a rota delega o agrupamento depois de buscar as linhas:

```ts
const result = groupBagsByType(rows);
```

O primeiro ID e a data do grupo continuam sendo os do primeiro registro recebido; a quantidade e a ordem dos grupos também são preservadas.

**Evidência:** `tests/api-bolsas.test.ts` verifica diretamente a função e mantém os testes de regressão da resposta da rota.

### 2. Preparatória — substituir o literal do volume pela constante da política

**Problema:** o cadastro de bolsas repetia `450`, embora o volume padrão já estivesse declarado em `INVENTORY_POLICY`. Alterações no volume poderiam deixar a regra central e o cadastro divergentes.

**Classificação:** a mudança elimina uma divergência antes que uma alteração futura na política de volume pudesse exigir ajustes em mais de um ponto. Ela prepara o código para essa evolução ao estabelecer uma única fonte de verdade.

**Antes** (`pages/api/inventory/bolsas.ts`):

```ts
volume_ml: 450,
```

**Depois:**

```ts
volume_ml: INVENTORY_POLICY.bagVolumeMl,
```

**Evidência:** teste da rota de cadastro compara o valor persistido com a constante da política e confirma a resposta `201`.

### 3. De compreensão — substituir o laço por um pipeline

**Problema:** `buildMovements` percorria as linhas com um laço que misturava a descoberta das entradas e saídas com a acumulação dos grupos. Isso escondia as etapas do processamento e tornava menos evidente que cada bolsa pode gerar uma entrada e, quando aplicável, uma saída.

**Classificação:** a prioridade dessa mudança é tornar o código mais fácil de entender. As etapas de transformação e acumulação passam a aparecer explicitamente, permitindo que a intenção do processamento seja identificada sem acompanhar todos os detalhes do laço.

**Antes** (`src/lib/stock-movements.ts`):

```ts
for (const row of rows) {
  addMovement(groups, 'ENTRADA', row, row.data_doacao, null);
  if ((STOCK_EXIT_STATUSES as readonly string[]).includes(row.status)) {
    addMovement(groups, row.status, row, row.atualizado_em, row.observacoes ?? null);
  }
}
```

**Depois:** `buildMovements` transforma cada linha em entradas de movimentação com `flatMap` e as acumula com `reduce`, deixando explícitas as etapas do pipeline:

```ts
const groups = rows
  .flatMap(getMovementInputs)
  .reduce((accumulator, input) => {
    addMovement(accumulator, input);
    return accumulator;
  }, new Map<string, StockMovement>());
```

Chaves, agrupamento, ordenação e limite permanecem iguais. A escolha é adequada porque a regra é naturalmente uma sequência de transformação e acumulação, e a forma declarativa facilita localizar cada etapa.

**Evidência:** os testes existentes de entradas, saídas, separação por tipo, ordenação e limite exercitam a função pública `buildMovements`.

### 4. De longo prazo — introduzir objeto-parâmetro para uma movimentação

**Problema:** `addMovement` recebia quatro argumentos relacionados à mesma movimentação (`tipo`, `row`, `data` e `observacoes`). A ordem desses argumentos podia ser confundida e qualquer novo dado exigiria ampliar a assinatura.

**Classificação:** o objeto-parâmetro cria uma estrutura estável para representar uma movimentação. O benefício principal é reduzir o custo de futuras evoluções, pois novos dados relacionados podem ser incorporados ao objeto sem ampliar repetidamente a lista posicional de argumentos.

**Antes** (`src/lib/stock-movements.ts`):

```ts
addMovement(groups, tipo, row, data, observacoes);
```

**Depois:** os dados foram reunidos em `MovementInput`, e a função recebe um único objeto:

```ts
addMovement(groups, input);
```

A escolha é adequada porque os quatro valores formam uma unidade conceitual e são usados juntos na chave e no registro final. O objeto torna a chamada autoexplicativa e cria um ponto estável para futuras informações, sem mudar o resultado produzido por `buildMovements`.

**Evidência:** a mesma suíte de movimentações confirma entradas, saídas, separação por tipo, ordenação e limite após a alteração da assinatura interna.

## Organização e validação

- O agrupamento foi colocado em `src/lib/inventory-policy.ts`, junto às operações puras do estoque.
- A política de volume já existente foi reutilizada, sem criar uma segunda fonte de configuração.
- Os testes focados de bolsas e movimentações verificam o comportamento anterior e os pontos extraídos.
- Testes direcionados: `npm exec -- jest --runInBand tests/api-bolsas.test.ts tests/evolucao-saidas-movimentacoes.test.ts` — 2 suítes e 23 testes aprovados.
- Suíte completa: `npm exec -- jest --runInBand` — 9 suítes e 82 testes aprovados.
- Tipagem: `npx tsc --noEmit` — aprovado.
- Build: `npm run build` — concluído com sucesso.

## Aprendizados

Separar transformações puras do código de integração facilita testar regras sem mocks de rede e mantém as rotas focadas em HTTP e persistência. Reaproveitar constantes já existentes também reduz a possibilidade de divergência sem alterar os dados produzidos hoje.
