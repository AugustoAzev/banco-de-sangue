package br.ufam.bancodesangue.elegibilidade;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

/** Os mesmos casos de {@code tests/donor-eligibility.test.ts}, em JUnit. */
@DisplayName("política central de elegibilidade de doadores")
class ElegibilidadeDoadorTest {

    @Test
    @DisplayName("preserva os limites de idade atualmente vigentes")
    void preservaOsLimitesDeIdade() {
        assertEquals(16, ElegibilidadeDoador.IDADE_MINIMA);
        assertEquals(69, ElegibilidadeDoador.IDADE_MAXIMA);
    }

    @ParameterizedTest(name = "aceita a idade elegível {0}")
    @ValueSource(ints = {16, 30, 69})
    void aceitaIdadesElegiveis(int idade) {
        assertTrue(ElegibilidadeDoador.idadeElegivel(idade));
    }

    // O caso `undefined` da versão em TypeScript não existe em Java; `null` cobre o mesmo papel.
    static Stream<Object> idadesInelegiveis() {
        return Arrays.stream(new Object[] {15, 70, -1, 16.5, "30", null});
    }

    @ParameterizedTest(name = "rejeita idade inelegível {0}")
    @MethodSource("idadesInelegiveis")
    void rejeitaIdadesInelegiveis(Object idade) {
        assertFalse(ElegibilidadeDoador.idadeElegivel(idade));
    }

    @Test
    @DisplayName("centraliza o prazo de vacina e os textos de triagem")
    void centralizaPrazoDeVacinaETextos() {
        assertEquals(48, ElegibilidadeDoador.ESPERA_VACINA_GRIPE_HORAS);
        assertEquals(
                List.of(
                        "Doador tem entre 16 e 69 anos",
                        "Doador pesa mais de 50kg",
                        "Não tomou vacina contra gripe nas últimas 48h"),
                ElegibilidadeDoador.CRITERIOS_TRIAGEM);
    }

    @Test
    @DisplayName("expõe uma mensagem de validação consistente com a política")
    void mensagemDeValidacao() {
        assertEquals("idade deve ser um número inteiro entre 16 e 69 anos", ElegibilidadeDoador.MENSAGEM_IDADE);
    }
}
