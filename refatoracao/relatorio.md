# Relatório — Trabalho Prático 5: Refatoração

**Disciplina:** Manutenção e Integração de Software

**Sistema:** Banco de Sangue
**Branch:** `tp5-refatoracao`

## Objetivo e restrição

O trabalho reorganiza a estrutura interna do estoque sem mudar o comportamento observado. Foram aplicadas duas técnicas do catálogo de Martin Fowler: **Extract Function** e **Replace Magic Number with Symbolic Constant**. A resposta das rotas e as regras de negócio foram mantidas.

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

### 2. Oportunista — substituir o literal do volume pela constante da política

**Problema:** o cadastro de bolsas repetia `450`, embora o volume padrão já estivesse declarado em `INVENTORY_POLICY`. Alterações no volume poderiam deixar a regra central e o cadastro divergentes.

**Antes** (`pages/api/inventory/bolsas.ts`):

```ts
volume_ml: 450,
```

**Depois:**

```ts
volume_ml: INVENTORY_POLICY.bagVolumeMl,
```

**Evidência:** teste da rota de cadastro compara o valor persistido com a constante da política e confirma a resposta `201`.

### 3. Oportunista — extrair a acumulação de uma movimentação

**Problema:** `buildMovements` continha inline a criação da chave de agrupamento, incremento da quantidade e inserção da movimentação, misturando essa regra com a iteração das linhas.

**Antes** (`src/lib/stock-movements.ts`):

```ts
const key = `${tipo}|${row.tipo_sanguineo_coletado}|${data}|${observacoes ?? ''}`;
const existing = groups.get(key);
if (existing) existing.quantidade += 1;
else groups.set(key, /* movimentação inicial */);
```

**Depois:** a inclusão está isolada em `addMovement`, e `buildMovements` expressa somente quais entradas e saídas devem ser consideradas:

```ts
addMovement(groups, 'ENTRADA', row, row.data_doacao, null);
```

Chaves, agrupamento, ordenação e limite permanecem iguais.

**Evidência:** os testes existentes de entradas, saídas, separação por tipo, ordenação e limite exercitam a função pública `buildMovements`.

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
