# Issue #2 — Idade negativa ou absurda aceita no cadastro de doadores

## Descrição

O endpoint `POST /api/donors` valida `idade` apenas para `undefined` ou `null`, aceitando qualquer inteiro — incluindo valores negativos, zero e números absurdamente altos (ex: `-50`, `0`, `9999`). Isso permite cadastrar doadores com idade fisicamente impossível, comprometendo a integridade dos dados e quebrando a regra de triagem "doador tem entre 16 e 69 anos" que o frontend exibe mas o backend não valida.

## Versão e Plataforma

- Versão: 1.0.0
- SO: Qualquer
- Navegador: Qualquer

## Passos para Reproduzir

1. Fazer login como administrador
2. Acessar `/doadores` → "Novo Doador"
3. Preencher nome, CPF, sexo, tipo sanguíneo
4. No campo Idade, digitar `-50`, `0` ou `9999`
5. Marcar os 3 critérios de triagem
6. Clicar "Cadastrar Doador"

## Resultado Obtido

O doador é cadastrado com sucesso, mesmo com idade inválida. A regra "entre 16 e 69 anos" é burlada.

## Resultado Esperado

Idades fora do intervalo `[16, 69]` devem ser rejeitadas com erro 400 e mensagem clara.

## Evidência

```typescript
// pages/api/donors/index.ts (linha 39)
if (idade === undefined || idade === null) return res.status(400).json({ detail: 'idade é obrigatória' });
// ← Falta validar se idade está no intervalo válido de 16 a 69 anos
```

## Classificação

- **Tipo:** Lógico
- **Severidade:** Média
