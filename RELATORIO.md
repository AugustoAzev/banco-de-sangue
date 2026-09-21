# Relatório Final — TP3: Manutenção Adaptativa

**Sistema:** Banco de Sangue (gestão de hemocentro — Next.js 15, TypeScript, Supabase)
**Repositório:** https://github.com/AugustoAzev/banco-de-sangue
**Documentação detalhada:** [`manutencao-adaptativa/`](./manutencao-adaptativa/) (plano de estratégia + evidência de cada uma das três adaptações)

## Síntese das adaptações

### 1. Mudança de dependência — TypeScript 7

**Problema:** ao investigar candidatos reais de upgrade (não hipotéticos), descobrimos que a versão `latest` do TypeScript no npm é a 7.0.2, lançada nesta semana — uma reescrita nativa em Go que remove a Compiler API em JavaScript. Isso quebra `ts-jest` (os três test suites do projeto passam a falhar 100%) e o próprio `next build`, que tenta se autocurar reinstalando outra versão e ainda assim falha.

**Adaptação:** fixação explícita de `typescript` em `5.9.3` (versão exata, sem faixa semver), com a decisão documentada no commit e em `evidencia1.md`, para não ser revertida sem querer por um upgrade automático futuro.

**Evidência:** logs reais de `npm install`, `npx jest` e `npm run build` antes e depois, incluindo a mensagem de erro exata do `ts-jest` e o aviso `ERESOLVE` do npm.

### 2. Mudança de regulamentação — LGPD

**Problema:** o sistema trata dados pessoais sensíveis (CPF, contato, tipo sanguíneo, histórico de doações) sem nenhum registro de consentimento, e doadores com doações associadas não tinham **nenhum** caminho para exercer o direito de eliminação de dados — a exclusão definitiva ficava bloqueada nesses casos.

**Adaptação:** (1) consentimento obrigatório e datado no cadastro de doador; (2) anonimização (em vez de exclusão) como novo endpoint `PATCH /donors/{id}/anonymize`, que remove PII mas preserva o histórico de doações exigido pela regulação da ANVISA.

**Evidência:** migration aditiva, 5 testes automatizados cobrindo as duas regras, e capturas de tela reais do formulário e do fluxo de anonimização (antes/depois do mesmo doador).

### 3. Integração de API externa — ViaCEP

**Problema:** o sistema não consumia nenhuma API externa; o cadastro de endereço era um campo de texto livre, sujeito a erro de digitação.

**Adaptação:** proxy interno `GET /api/cep/{cep}` que consulta o ViaCEP e autopreenche logradouro/bairro/cidade/UF no formulário de doador. Testado no Postman antes da integração — o que revelou que o ViaCEP responde com HTML (não JSON) para CEP mal formatado, o que moldou a validação implementada no proxy.

**Evidência:** coleção Postman com respostas reais, 4 testes automatizados do proxy, e captura de tela mostrando o autofill acontecendo de verdade contra o ViaCEP real (não mockado).

## Números

- **3** estratégias adaptativas implementadas e evidenciadas.
- **4** commits dedicados (um por estratégia + um de evidência visual), histórico completo em `git log`.
- **9** novos testes automatizados (33 no total, todos passando).
- **0** regressões — `npm run build` e `npx jest` verdes após cada uma das três mudanças.

## Reflexão crítica

O maior aprendizado deste trabalho não foi nenhuma das três adaptações em si, mas o processo de **verificar antes de assumir**. A primeira hipótese para a Estratégia 1 (`bcryptjs`) parecia razoável, mas testes reais mostraram que a suposição estava errada — os mantenedores já cuidam de compatibilidade retroativa na maioria dos casos. Só testando empiricamente três candidatos diferentes chegamos à incompatibilidade real (`typescript`). Isso reflete uma tensão real da manutenção adaptativa: o ecossistema de dependências muda rápido demais para confiar em intuição ou em conhecimento desatualizado — é preciso reproduzir o problema antes de reportá-lo como problema.

Na frente de regulamentação, o ponto mais delicado foi perceber que "excluir dados a pedido do titular" e "obrigação legal de reter histórico de doações" são exigências que podem parecer conflitantes à primeira vista — a anonimização foi a solução que atende as duas sem comprometer nenhuma. É um lembrete de que adaptação regulatória raramente é "adicionar um checkbox e pronto": exige entender a regra de negócio por trás do dado, não só o dado.

Por fim, a integração de API externa reforçou o valor de testar no Postman **antes** de escrever o código de integração — o comportamento inesperado do ViaCEP para entradas mal formatadas (HTML em vez de JSON) só apareceu porque testamos esse caso de borda antes de integrar, e isso moldou diretamente o design do proxy (validar antes de repassar).
