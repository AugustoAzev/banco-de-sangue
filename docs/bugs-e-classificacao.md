# Bugs e Classificação — Banco de Sangue

## Metodologia

Os bugs foram identificados através de análise estática do código-fonte (code review manual) das rotas da API e páginas do frontend.

---

## Bug 1 — Agrupamento de Bolsas Retorna ID Inválido

- **Tipo:** Lógico
- **Local:** `pages/api/inventory/bolsas.ts`, linhas 39-44
- **Severidade:** Alta
- **Ferramenta de apoio:** Code review manual

### Descrição

Ao listar as bolsas em estoque, o endpoint agrupa bolsas por tipo sanguíneo. Porém, para todas as entradas agrupadas, o campo `id` é definido como `0`:

```typescript
const result: Bolsa[] = Object.entries(grouped).map(([tipo_sangue, bolsas]) => ({
  id: 0,              // ← bug: sempre 0 para todas as entradas
  tipo_sangue,
  quantidade: bolsas.length,
  created_at: bolsas[0]?.created_at,
}));
```

Isso impede que o frontend delete uma bolsa específica, pois o botão de exclusão chama `/inventory/bolsas/0` — que naturalmente não corresponde a nenhuma bolsa real.

### Passos para reproduzir

1. Fazer login como administrador
2. Ir em Estoque de Sangue
3. Clicar no botão de excluir em qualquer linha da tabela
4. A exclusão falha ou exclui de forma incorreta

### Correção necessária

Preservar os IDs reais das bolsas agrupadas, usando um identificador composto (ex: primeiro ID da lista) ou retornando as bolsas não agrupadas para que o frontend possa deletar individualmente.

---

## Bug 2 — Validação de CPF Duplicado Ignora Erros de Rede

- **Tipo:** Segurança
- **Local:** `pages/api/donors/index.ts`, linhas 45-54
- **Severidade:** Alta
- **Ferramenta de apoio:** Code review manual

### Descrição

Antes de cadastrar um novo doador, o endpoint verifica se o CPF já existe. Porém, se a chamada ao Supabase retornar erro (ex:timeout, 500, indisponibilidade), o bloco `if (cpfCheck.ok)` não é executado e a verificação é completamente ignorada:

```typescript
const cpfCheck = await supabaseFetch(
  `/rest/v1/doadores?cpf=eq.${encodeURIComponent(cpf)}&select=id_doador&limit=1`,
  { method: 'GET' }
);
if (cpfCheck.ok) {           // ← se falhar, bloco é SKIPPADO
  const existing = await cpfCheck.json();
  if (existing.length > 0) {
    return res.status(400).json({ detail: 'CPF já cadastrado' });
  }
}
// fluxo continua mesmo se cpfCheck.ok === false
```

Um invasor (ou falha de rede) pode cadastrar CPFs duplicados, comprometendo a integridade dos dados de doadores.

### Correção necessária

Tratar qualquer resposta não-OK como erro, impedindo o cadastro quando a verificação de CPF não puder ser realizada:

```typescript
if (!cpfCheck.ok) {
  return res.status(502).json({ detail: 'Erro ao verificar CPF' });
}
```

---

## Bug 3 — Sem Validação de Tipo Sanguíneo no POST Bolsas

- **Tipo:** Lógico / Runtime
- **Local:** `pages/api/inventory/bolsas.ts`, método POST, linha 53
- **Severidade:** Média
- **Ferramenta de apoio:** Code review manual

### Descrição

O endpoint `POST /inventory/bolsas` aceita qualquer string no campo `tipo_sanguineo` sem validar contra os valores do ENUM definido no banco (`A_POSITIVO`, `A_NEGATIVO`, `B_POSITIVO`, `B_NEGATIVO`, `AB_POSITIVO`, `AB_NEGATIVO`, `O_POSITIVO`, `O_NEGATIVO`):

```typescript
// Apenas verifica se existe, não se é um valor válido do ENUM
if (!tipo_sangue) return res.status(400).json({ detail: 'tipo_sangue é obrigatório' });
// ← Falta: validar se tipo_sangue está no conjunto de valores válidos
```

Valores inválidos são aceitos e armazenados no banco, causando inconsistência de dados.

### Correção necessária

Validar `tipo_sangue` contra a lista de valores permitidos antes de inserir no banco.

---

## Ferramentas de Apoio Investigadas

### Dependabot

O Dependabot foi verificado no repositório. Alguns alertas foram identificados:

- **bcryptjs** está em versão `2.4.3` — verificar se há vulnerabilidades conhecidas
- **jsonwebtoken** em `9.0.0` — verificar se há CVEs abertas

> **Nota:** O projeto usa Next.js 15 e React 19. Verificar se há patches de segurança disponíveis para essas dependências principais via `npm audit` ou Dependabot alerts.
