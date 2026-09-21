# Plano de Estratégia Adaptativa — Banco de Sangue

**Disciplina:** Manutenção e Integração de Software — TP3 (Manutenção Adaptativa)
**Sistema:** [banco-de-sangue](https://github.com/AugustoAzev/banco-de-sangue) — gestão de hemocentro (Next.js 15 + TypeScript + Supabase)
**Data:** 21/09/2026

## 1. Objetivo

Aplicar manutenção adaptativa em três frentes exigidas pelo enunciado: mudança de dependência, mudança de regulamentação e integração/migração de API externa — com evidência real de funcionamento antes e depois de cada adaptação, não simulações escritas.

## 2. Metodologia de investigação (importante para entender as decisões abaixo)

Antes de escolher o que adaptar, mapeamos o estado real do sistema:

- `npm outdated` para levantar candidatos de upgrade.
- README e código-fonte para confirmar que o sistema **não consumia nenhuma API externa** (só Supabase, que é o próprio banco).
- Leitura de `app/(protected)/doadores/page.tsx` e das rotas `pages/api/donors/*` para entender onde dados pessoais sensíveis (CPF, contato, histórico de saúde) são tratados — ponto de entrada natural para a adaptação de regulamentação.

Para a Estratégia 1 (dependência), em vez de assumir que qualquer upgrade de major version quebraria algo, **testamos empiricamente** três candidatos reais antes de escolher: `bcryptjs` (2.4.3→3.0.3), `lucide-react` (0.555→1.47) e `next` (15.3→16.3). Nos três casos, `npm run build` e `npx jest` continuaram passando sem erro — os mantenedores dessas bibliotecas cuidaram da compatibilidade retroativa. Só ao testar `typescript` (latest = 7.0.2, lançado nesta mesma semana) encontramos uma incompatibilidade real e reproduzível com a toolchain do projeto (`ts-jest` e a checagem de tipos interna do `next build`). Essa disciplina de "testar antes de documentar" é o motivo de a Estratégia 1 não ser sobre a dependência mais óbvia (`bcryptjs`, sugerida inicialmente), e sim sobre `typescript`.

## 3. As três estratégias

| # | Estratégia | O que foi adaptado | Documento |
|---|---|---|---|
| 1 | Mudança de dependência | `typescript` 5.9.3 → 7.0.2 quebra `ts-jest` e `next build`; fixado em `5.9.3` até o ecossistema suportar TS7 | [evidencia1.md](./evidencia1.md) |
| 2 | Mudança de regulamentação (LGPD) | Consentimento obrigatório no cadastro de doador + anonimização em vez de exclusão definitiva | [evidencia2.md](./evidencia2.md) |
| 3 | Integração de API externa | Autopreenchimento de endereço via ViaCEP (sistema não consumia nenhuma API externa antes) | [evidencia3.md](./evidencia3.md) |

## 4. Decisões e trade-offs

### Estratégia 1 — por que fixar a versão em vez de "consertar" para funcionar com TS7?

TypeScript 7 é uma reescrita nativa em Go que **remove a Compiler API em JavaScript** — não é um bug pontual do `ts-jest`, é uma mudança arquitetural do próprio compilador. A mensagem de erro do `ts-jest` já indica o caminho oficial futuro ("instalar como `@typescript/native`..."), mas esse pacote ainda não está estabilizado no ecossistema em 21/09/2026. Migrar a suíte de testes agora seria trocar uma ferramenta madura (`ts-jest`) por uma em transição, sem necessidade — o pin explícito documenta a decisão e evita que ela seja revertida sem querer por um `npm update` ou PR automático do Dependabot.

### Estratégia 2 — por que anonimizar em vez de excluir?

Doadores de sangue têm histórico regulado pela ANVISA (rastreabilidade de doações). Antes da adaptação, o `DELETE /donors/{id}` já **bloqueava** a exclusão de doadores com doações associadas — ou seja, esses doadores não tinham nenhum caminho para exercer o direito de eliminação de dados pessoais (LGPD art. 18, VI). A anonimização resolve as duas exigências ao mesmo tempo: remove os dados pessoais identificáveis (atendendo à LGPD) e preserva o registro estatístico/regulatório do histórico de doações (atendendo à ANVISA). Também adicionamos o consentimento explícito no cadastro, mesmo sabendo que a base legal principal do tratamento aqui é "cumprimento de obrigação legal/regulatória" (LGPD art. 7º, II) e não o consentimento — fizemos isso por transparência com o titular dos dados (LGPD art. 9º), que é uma prática comum mesmo quando o consentimento não é estritamente obrigatório.

### Estratégia 3 — por que um proxy interno em vez de chamar o ViaCEP direto do frontend?

Descobrimos no Postman que o ViaCEP responde com HTML (não JSON) para CEP mal formatado — um proxy interno permite validar o formato antes de repassar a chamada, além de isolar o frontend do contrato exato do provedor externo (se um dia trocarmos para outro provedor de CEP, só o proxy muda).

## 5. Como as evidências visuais foram capturadas (sem depender de Supabase real)

Este ambiente não tem um projeto Supabase configurado (sem `.env` original), então não dava pra fazer login de verdade nem persistir doadores reais. Para gerar evidência visual **honesta e reprodutível** mesmo assim:

1. Criamos um `.env` local (não commitado — já coberto pelo `.gitignore`) só com um `JWT_SECRET` de teste. Nenhuma credencial real de Supabase foi usada ou é necessária para os fluxos capturados.
2. Um script Playwright (não commitado) assina um JWT válido com esse mesmo segredo e injeta no `localStorage` antes da navegação — equivalente a estar logado, sem precisar de um formulário de login real ou de um banco de usuários.
3. A listagem de doadores (`GET /api/donors/`) foi interceptada no navegador (`page.route`) para simular dois doadores de exemplo, um deles já anonimizado — isso permite mostrar visualmente o contraste "ativo vs. anonimizado" numa única tela, sem exigir um banco populado. **Essa é a única parte simulada.**
4. A chamada de CEP (`GET /api/cep/{cep}`) **não foi interceptada** — passou de verdade pelo backend Next.js local, que chamou o ViaCEP real pela internet. O endereço "Avenida Paulista, Bela Vista, São Paulo - SP" na captura de tela é uma resposta real do ViaCEP, não um mock.

Essa metodologia está descrita aqui por transparência: o objetivo era produzir evidência que reflita o comportamento real do código, isolando apenas a única dependência externa (Supabase) que não temos como provisionar neste ambiente de avaliação.

## 6. Boas práticas aplicadas / visão de longo prazo

- **Migrations aditivas**: nenhuma coluna existente foi alterada ou removida (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`), compatível com dados já em produção.
- **Testes automatizados para cada regra de negócio nova** (consentimento obrigatório, anonimização idempotente, validação de CEP) — não apenas para o "caminho feliz". 33 testes automatizados no total após as três estratégias (24 pré-existentes + 9 novos).
- **Decisões de dependência documentadas no código e no commit**, não só na cabeça de quem fez — qualquer pessoa do time entende, meses depois, por que `typescript` está fixado numa versão específica.
- **Desacoplamento de provedor externo** (proxy `/api/cep`) para reduzir o custo de uma futura troca de fornecedor de CEP.
- **Próximos passos sugeridos** (fora do escopo deste TP): job periódico para revisar doadores inativos há muito tempo e sugerir anonimização proativa; acompanhar o pacote `@typescript/native` citado pelo `ts-jest` para eventualmente destravar o upgrade do TypeScript 7.
