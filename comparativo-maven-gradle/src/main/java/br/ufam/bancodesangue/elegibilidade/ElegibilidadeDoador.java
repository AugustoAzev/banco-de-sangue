package br.ufam.bancodesangue.elegibilidade;

import java.util.List;

/**
 * Regra de elegibilidade de doadores do Banco de Sangue, portada para Java.
 *
 * <p>É a mesma regra de {@code src/lib/donor-eligibility.ts}, com os mesmos casos de teste.
 * Existe só para comparar o processo de build no npm, no Maven e no Gradle; o sistema
 * continua usando a versão em TypeScript.
 */
public final class ElegibilidadeDoador {

    public static final int IDADE_MINIMA = 16;
    public static final int IDADE_MAXIMA = 69;
    public static final int ESPERA_VACINA_GRIPE_HORAS = 48;

    public static final String MENSAGEM_IDADE =
            "idade deve ser um número inteiro entre " + IDADE_MINIMA + " e " + IDADE_MAXIMA + " anos";

    public static final List<String> CRITERIOS_TRIAGEM = List.of(
            "Doador tem entre " + IDADE_MINIMA + " e " + IDADE_MAXIMA + " anos",
            "Doador pesa mais de 50kg",
            "Não tomou vacina contra gripe nas últimas " + ESPERA_VACINA_GRIPE_HORAS + "h");

    private ElegibilidadeDoador() {
    }

    /**
     * Aceita só um número inteiro dentro da faixa de idade.
     *
     * <p>Recebe {@code Object}, como o {@code unknown} da versão em TypeScript, porque a idade
     * chega de um formulário e pode vir como texto, fracionária ou vazia.
     */
    public static boolean idadeElegivel(Object idade) {
        if (!(idade instanceof Number numero)) {
            return false;
        }
        double valor = numero.doubleValue();
        boolean inteiro = !Double.isInfinite(valor) && valor == Math.floor(valor);
        return inteiro && valor >= IDADE_MINIMA && valor <= IDADE_MAXIMA;
    }
}
