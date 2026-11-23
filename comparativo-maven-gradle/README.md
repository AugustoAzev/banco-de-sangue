# Comparativo: a mesma regra em npm, Maven e Gradle

Módulo didático da atividade de build e automação ([`RELATORIO-BUILD.md`](../RELATORIO-BUILD.md)). Ele pega **uma regra real do Banco de Sangue**, a idade do doador (número inteiro de 16 a 69 anos), e a constrói com as três ferramentas do tema, usando os mesmos casos de teste.

| | Regra | Testes | Arquivo de build |
|---|---|---|---|
| **npm** (o sistema) | [`src/lib/donor-eligibility.ts`](../src/lib/donor-eligibility.ts) | [`tests/donor-eligibility.test.ts`](../tests/donor-eligibility.test.ts) (Jest) | [`package.json`](../package.json) |
| **Maven** | [`ElegibilidadeDoador.java`](./src/main/java/br/ufam/bancodesangue/elegibilidade/ElegibilidadeDoador.java) | [`ElegibilidadeDoadorTest.java`](./src/test/java/br/ufam/bancodesangue/elegibilidade/ElegibilidadeDoadorTest.java) (JUnit) | [`pom.xml`](./pom.xml) |
| **Gradle** | o mesmo código Java | os mesmos testes JUnit | [`build.gradle.kts`](./build.gradle.kts) |

O sistema continua usando só a versão em TypeScript. Este módulo existe para mostrar, com código que roda, que o ciclo de vida montado em scripts npm é o mesmo que o Maven e o Gradle trazem prontos.

## O mesmo ciclo de vida nas três ferramentas

| Etapa | npm | Maven (fase) | Gradle (tarefa) |
|---|---|---|---|
| Conferir o ambiente | `engines` + `.nvmrc` | `validate` (`maven-enforcer-plugin`: Java 21 e Maven 3.9) | `java.toolchain` (Java 21) |
| Compilar | `npm run typecheck` | `compile` | `compileJava` |
| Testar | `npm test` | `test` (Surefire + JUnit) | `test` (JUnit Platform) |
| Empacotar | `npm run build` + `npm run package` | `package` → `target/elegibilidade-doador-1.3.0.jar` | `jar` → `build/libs/elegibilidade-doador-1.3.0.jar` |
| Tudo em ordem, parando na primeira falha | `npm run verify` | `mvn verify` | `gradle build` |
| Dependências só de teste | `devDependencies` | `<scope>test</scope>` | `testImplementation` |
| Versões travadas | `package-lock.json` + `npm ci` | versões fixas no `pom.xml` | versões fixas no `build.gradle.kts` |

**A diferença que aparece rodando:** no Maven e no Gradle não foi preciso escrever o ciclo, só declarar o projeto. No npm, cada etapa e a ordem entre elas estão escritas à mão no `package.json`.

**Fila contra grafo:** o log mostra a diferença de fundo entre os dois. O Maven segue uma fila de fases, e o `.jar` (fase `package`) só sai depois dos testes (fase `test`). O Gradle monta um grafo de tarefas: `build` depende de `assemble` (o `jar`) e de `check` (o `test`), mas o `jar` não depende dos testes, por isso sai antes deles (`compileJava`, `jar`, `test`, `check`, `build`). Se um teste falha, o `build` falha nos dois casos, e o workflow não publica nenhum `.jar`.

## Como rodar

**No GitHub (não precisa instalar nada):** Actions → **Comparativo npm, Maven e Gradle** → **Run workflow**. Os três jobs rodam lado a lado ([`comparativo-maven-gradle.yaml`](../.github/workflows/comparativo-maven-gradle.yaml)), e os dois `.jar` ficam disponíveis como artifacts.

**Na máquina**, com Java 21, Maven 3.9 e Gradle instalados, dentro desta pasta:

```bash
mvn verify
gradle build
```

## Limitação conhecida

O repositório não traz os wrappers (`mvnw` e `gradlew`), que fixariam a versão da ferramenta dentro do próprio projeto, como o `.nvmrc` faz com o Node. No CI, a versão do Gradle está fixada no workflow (9.9.2), e o Maven é o da imagem do GitHub, com a versão mínima conferida pelo `maven-enforcer-plugin`.
