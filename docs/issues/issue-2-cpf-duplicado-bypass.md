# Issue #2 — Validação de CPF duplicado é ignorada em caso de erro de rede

## Descrição

No endpoint `POST /api/donors`, a verificação de CPF duplicado está dentro de um `if (cpfCheck.ok)` que **ignora silenciosamente** qualquer erro de comunicação com o Supabase. Com isso, CPFs duplicados podem ser cadastrados quando o Supabase está com problemas de rede, timeout, ou retornando 500.

## Versão e Plataforma

- Versão: 1.0.0
- SO: Linux (Vercel)
- Cliente: Qualquer

## Passos para Reproduzir

1. Fazer login
2. Simular falha de rede no Supabase (ex: bloquear temporariamente o domínio `*.supabase.co`)
3. Tentar cadastrar um novo doador com um CPF que já existe
4. Observar que o cadastro é **concluído com sucesso**, criando um registro duplicado

## Resultado Obtido

O doador é cadastrado normalmente, mesmo com CPF duplicado, porque a validação foi pulada.

## Resultado Esperado

Quando a verificação de CPF não puder ser realizada com sucesso, o cadastro deve ser **rejeitado** com erro 502 ou 500.

## Evidência

```typescript
// pages/api/donors/index.ts (linhas 45-54)
const cpfCheck = await supabaseFetch(...);
if (cpfCheck.ok) {  // ← se falhar, bloco é SKIPPADO
  const existing: { id_doador: string }[] = await cpfCheck.json();
  if (existing.length > 0) {
    return res.status(400).json({ detail: 'CPF já cadastrado' });
  }
}
// fluxo continua mesmo se cpfCheck.ok === false
```

## Classificação

- **Tipo:** Segurança
- **Severidade:** Alta
