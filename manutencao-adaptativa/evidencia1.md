# Evidência 1 — Simulação de Mudança de Dependência

## Dependência escolhida

`typescript` (compilador/toolchain), usado por todo o projeto (`tsc`, `next build`, `ts-jest`).

## Contexto

Em 21/09/2026, ao investigar candidatos reais de upgrade no projeto (`npm outdated`), a equipe testou empiricamente três dependências com major version disponível: `bcryptjs` (2.4.3 → 3.0.3), `lucide-react` (0.555.0 → 1.47.0) e `next` (15.3 → 16.3). Nas três, `npm run build` e `npx jest` continuaram passando sem nenhum erro — os mantenedores dessas bibliotecas já cuidam de manter compatibilidade retroativa (ex.: `bcryptjs@3` e `lucide-react@1` mantêm exports/aliases antigos).

Ao checar `typescript`, encontramos um caso real: a versão `latest` publicada no npm era a **7.0.2** — o TypeScript 7, reescrita nativa em Go do compilador (anunciada pela Microsoft), que **não expõe mais a Compiler API em JavaScript** que ferramentas como `ts-jest` usam internamente. O projeto está pinado em `~5.9.3`, mas nada impede alguém do time (ou um PR automático do Dependabot) de rodar `npm install typescript@latest` manualmente.

## Evidência "antes" — build e testes passando (TypeScript 5.9.3)

```
$ npx jest --silent
Test Suites: 3 passed, 3 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        2.572 s

$ npm run build
▲ Next.js 15.5.19
✓ Compiled successfully in 37.0s
✓ Generating static pages (8/8)
```

## Reprodução do problema — upgrade para TypeScript 7.0.2

```
$ npm install typescript@7.0.2

npm warn ERESOLVE overriding peer dependency
npm warn While resolving: banco-de-sangue@1.0.0
npm warn Found: typescript@5.9.3
npm warn node_modules/typescript
npm warn   peer typescript@">=4.3 <7" from ts-jest@29.4.12
npm warn node_modules/ts-jest
npm warn     dev ts-jest@"^29.4.12" from the root project
npm warn
npm warn Could not resolve dependency:
npm warn peer typescript@">=4.3 <7" from ts-jest@29.4.12
```

O `npm` já avisa, no ato da instalação, que `ts-jest@29.4.12` declara suporte apenas a `typescript >=4.3 <7` — ou seja, a própria dependência de teste do projeto **não é compatível com o TypeScript 7**.

### Testes unitários quebram

```
$ npx jest --silent

FAIL tests/donor-eligibility.test.ts
  ● Test suite failed to run

    The TypeScript compiler "typescript" (version 7.0.2) does not expose the
    JavaScript compiler API required by ts-jest. To use TypeScript 7 for
    project type-checking, install it as "@typescript/native" and alias
    "@typescript/typescript6" as "typescript" for ts-jest.

FAIL tests/api-bolsas.test.ts
  ● Test suite failed to run
    (mesmo erro)

FAIL tests/api-donors-cpf.test.ts
  ● Test suite failed to run
    (mesmo erro)

Test Suites: 3 failed, 3 total
Tests:       0 total
```

Os 24 testes que antes passavam agora falham 100% — nenhum sequer executa, porque `ts-jest` não consegue nem carregar o compilador.

### O build de produção também quebra

```
$ npm run build

▲ Next.js 15.5.19
✓ Compiled successfully in 7.9s
  Linting and checking validity of types ...
It looks like you're trying to use TypeScript but do not have the required
package(s) installed. Installing dependencies

Installing devDependencies (npm):
- typescript@5.8.2

Invalid Version: undefined
Next.js build worker exited with code: 1 and signal: null
```

O próprio `next build` (15.5.19) não reconhece a instalação do TypeScript 7 como válida, tenta se "autocurar" reinstalando uma versão 5.x por conta própria e ainda assim quebra com `Invalid Version: undefined`. Ou seja: **em setembro de 2026, nem a toolchain de testes (`ts-jest`) nem o Next.js 15 suportam o TypeScript 7.**

## Adaptação implementada (correção)

Como o TypeScript 7 ainda não é suportado pelo ecossistema de ferramentas usado pelo projeto, a decisão de manutenção adaptativa foi **fixar explicitamente a versão do TypeScript em `5.9.3`** (sem faixa `^`/`~`), em vez de deixar em aberto para uma resolução futura de `npm install`/Dependabot puxar a v7 silenciosamente e quebrar o pipeline de novo:

```diff
- "typescript": "~5.9.3"
+ "typescript": "5.9.3"
```

(arquivo: `package.json` / `package-lock.json`)

## Evidência "depois" — build e testes voltam a passar

```
$ npx jest --silent
Test Suites: 3 passed, 3 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        1.47 s

$ npm run build
✓ Compiled successfully
✓ Generating static pages (8/8)
```

## Conclusão

- **Problema real, não simulado**: reproduzido com comandos reais (`npm install`, `npx jest`, `npm run build`) nas versões publicadas no npm nesta data.
- **Causa raiz**: TypeScript 7 trocou o compilador JS clássico por um binário nativo em Go, removendo a Compiler API em JavaScript que `ts-jest` (e a checagem de tipos interna do Next 15) dependem para funcionar.
- **Decisão documentada**: pin exato em `5.9.3` até que `ts-jest`/Next.js publiquem suporte oficial ao TypeScript 7 (ex.: via o pacote `@typescript/native` citado na própria mensagem de erro do ts-jest).
- **Commits**: ver histórico do Git — commit de captura da evidência e commit da correção (`chore(deps): fixar typescript em 5.9.3 (TS7 quebra ts-jest e next build)`).
