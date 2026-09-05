# Issue #3 — Campo CPF aceita caracteres não-numéricos (emojis, letras, símbolos)

## Descrição

O endpoint `POST /api/donors` valida `cpf` apenas para `falsy` (string vazia, undefined, null), aceitando **qualquer string** — incluindo letras, emojis, símbolos e caracteres especiais. CPF é um documento que deve conter apenas 11 dígitos (com ou sem formatação), mas o sistema aceita `"😀🎉"`, `"abc.def.ghi-jk"`, `"SELECT * FROM usuarios"` (potencial SQL injection via payload, embora Supabase use parameterized queries).

## Versão e Plataforma

- Versão: 1.0.0
- SO: Qualquer
- Navegador: Qualquer

## Passos para Reproduzir

1. Fazer login como administrador
2. Acessar `/doadores` → "Novo Doador"
3. Preencher nome, idade, sexo, tipo sanguíneo
4. No campo CPF, digitar `😀😀😀` ou `abc.def.ghi-jk` ou `123abc`
5. Marcar os 3 critérios de triagem
6. Clicar "Cadastrar Doador"

## Resultado Obtido

O doador é cadastrado com sucesso, mesmo com CPF contendo emojis ou letras.

## Resultado Esperado

O backend deve validar que o CPF contém apenas dígitos (com ou sem formatação) e o frontend deve rejeitar entrada inválida.

## Evidência

```typescript
// pages/api/donors/index.ts (linha 37)
if (!cpf) return res.status(400).json({ detail: 'cpf é obrigatório' });
// ← Falta validar formato do CPF (apenas dígitos com ou sem máscara)
```

Frontend (`app/(protected)/doadores/page.tsx`, linha 162):
```tsx
<input name="cpf" ... placeholder="000.000.000-00" required />
// ← Falta pattern ou inputMode="numeric" para evitar caracteres não-numéricos
```

## Classificação

- **Tipo:** Validação / Segurança
- **Severidade:** Alta
