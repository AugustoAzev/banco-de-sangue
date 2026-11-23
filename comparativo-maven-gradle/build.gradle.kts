// Build Gradle da regra de elegibilidade do doador, para comparar com o npm e o Maven.
// O Gradle monta um grafo de tarefas: `gradle build` roda compileJava, test, jar e check,
// e pula as que já estão em dia (build incremental).

import org.gradle.api.tasks.testing.logging.TestExceptionFormat

plugins {
    java
}

// Identidade do projeto: no npm, são o "name" e o "version" do package.json.
group = "br.ufam.bancodesangue"
version = "1.3.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

// testImplementation equivale às devDependencies: só existe na fase de teste.
dependencies {
    testImplementation(platform("org.junit:junit-bom:6.1.3"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
}

// Se um teste falha, a tarefa test falha e o jar não é gerado.
tasks.test {
    useJUnitPlatform()
    testLogging {
        events("passed", "failed", "skipped")
        exceptionFormat = TestExceptionFormat.FULL
    }
}
