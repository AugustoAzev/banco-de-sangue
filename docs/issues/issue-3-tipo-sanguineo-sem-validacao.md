# Issue #3 — POST /bolsas não valida tipo_sanguineo contra valores do ENUM

## Descrição

O endpoint `POST /api/inventory/bolsas` aceita qualquer string no campo `tipo_sangue` sem validar contra os valores válidos do ENUM `tiposanguineo` (`A_POSITIVO`, `A_NEGATIVO`, `B_POSITIVO`, `B_NEGATIVO`, `AB_POSITIVO`, `AB_NEGATIVO`, `O_POSITIVO`, `O_NEGATIVO`).

## Versão e Plataforma

- Versão: 1.0.0
- SO: Qualquer

## Passos para Reproduzir

1. Fazer login
2. Acessar `/estoque`
3. Abrir o formulário "Registrar Entrada"
4. Selecionar um tipo sanguíneo
5. (Hipotético, com manipulação da request) Enviar um `tipo_sangue` inválido como `XYZ_INVALIDO`
6. Observar que a bolsa é cadastrada com sucesso no banco, mesmo com tipo inválido

## Resultado Obtido

Bolsas com tipos sanguíneos inválidos são inseridas no banco, corrompendo a integridade dos dados.

## Resultado Esperado

Tipos sanguíneos inválidos devem ser rejeitados com erro 400 antes de chegar ao banco.

## Evidência

```typescript
// pages/api/inventory/bolsas.ts (linha 53)
if (!tipo_sangue) return res.status(400).json({ detail: 'tipo_sangue é obrigatório' });
// ← Falta validação contra valores válidos do ENUM
```

## Classificação

- **Tipo:** Lógico / Runtime
- **Severidade:** Média
