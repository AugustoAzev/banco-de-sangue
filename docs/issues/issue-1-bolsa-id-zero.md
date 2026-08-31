# Issue #1 — Bolsas agrupadas retornam id: 0, impedindo exclusão

## Descrição

O endpoint `GET /api/inventory/bolsas` agrupa bolsas por tipo sanguíneo, mas define o campo `id` como `0` para todas as entradas. Isso faz com que o botão de excluir na UI chame `/api/inventory/bolsas/0`, o que não corresponde a nenhuma bolsa real.

## Versão e Plataforma

- Versão: 1.0.0
- SO: Windows 11
- Navegador: Chrome 126

## Passos para Reproduzir

1. Fazer login com `admin@banco-sangue.com` / `12345678`
2. Acessar a página `/estoque`
3. Clicar no ícone de lixeira em qualquer linha da tabela
4. Confirmar a exclusão
5. Verificar que a bolsa não foi excluída

## Resultado Obtido

A exclusão falha silenciosamente, pois o `id` enviado ao backend é sempre `0`.

## Resultado Esperado

Cada linha deve ter um `id` válido, e a exclusão deve funcionar corretamente.

## Evidência

```typescript
// pages/api/inventory/bolsas.ts (linha 39-44)
const result: Bolsa[] = Object.entries(grouped).map(([tipo_sangue, bolsas]) => ({
  id: 0,  // ← bug
  tipo_sangue,
  quantidade: bolsas.length,
  created_at: bolsas[0]?.created_at,
}));
```

## Classificação

- **Tipo:** Lógico
- **Severidade:** Alta
