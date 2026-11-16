# Evidências do build

Saídas reais dos comandos, gravadas no terminal da equipe em 15/11/2026. Os caminhos locais foram trocados por `<projeto>`. Contexto e análise em [`../README.md`](../README.md).

## Antes (master em [`234840a`](https://github.com/AugustoAzev/banco-de-sangue/commit/234840addd8e42827863c710ebc9674a4a5be70c), versão 1.2.0)

| Arquivo | Comando | O que mostra |
|---|---|---|
| [`01-npm-run-lint.txt`](./antes/01-npm-run-lint.txt) | `npm run lint` | o `next lint` descontinuado para numa pergunta interativa e sai com erro |
| [`02-tsc.txt`](./antes/02-tsc.txt) | `npx tsc --noEmit` | passa, mas num clone limpo verifica 0 das 14 rotas da API |
| [`03-jest.txt`](./antes/03-jest.txt) | `npx jest --runInBand` | os 82 testes passam, mas nenhum script nem o CI os chamava |
| [`04-npm-ci.txt`](./antes/04-npm-ci.txt) | `npm ci` | instalação limpa em 97 s |
| [`05-npm-run-build.txt`](./antes/05-npm-run-build.txt) | `npm run build` | build de produção em 47 s |
| [`06-npm-audit.txt`](./antes/06-npm-audit.txt) | `npm audit --omit=dev` | 10 falhas nas dependências de produção, 1 crítica |
| [`07-npm-test.txt`](./antes/07-npm-test.txt) | `npm test` | o Playwright pega os arquivos do Jest, não acha teste nenhum e falha |

## Depois (branch `build-automacao`, versão 1.3.0)

| Arquivo | Comando | O que mostra |
|---|---|---|
| [`01-npm-ci.txt`](./depois/01-npm-ci.txt) | `npm ci` | instalação limpa, sem `node_modules` nem `.next` |
| [`02-npm-run-verify.txt`](./depois/02-npm-run-verify.txt) | `npm run verify` | lint (0 erros), tipos, 82 testes e build com `postbuild`, em 91 s |
| [`03-npm-run-package.txt`](./depois/03-npm-run-package.txt) | `npm run package` | pacote `banco-de-sangue-1.3.0.tar.gz` de 17,5 MB |
| [`04-e2e-no-pacote.txt`](./depois/04-e2e-no-pacote.txt) | `npx playwright test` | 5 de 5 testes E2E contra o pacote extraído e iniciado com `node server.js` |
