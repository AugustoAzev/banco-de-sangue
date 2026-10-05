import { DONOR_ELIGIBILITY, DONOR_SCREENING_CRITERIA } from './donor-eligibility';

export interface DonorFormValues {
  nome: string;
  cpf: string;
  idade: string;
  sexo: string;
  tipo_sanguineo: string;
  email: string;
  condicao_1: boolean;
  condicao_2: boolean;
  condicao_3: boolean;
  consentimento_lgpd: boolean;
}

export type DonorFormField = 'nome' | 'cpf' | 'idade' | 'sexo' | 'tipo_sanguineo' | 'email' | 'triagem' | 'consentimento_lgpd';
export type DonorFormErrors = Partial<Record<DonorFormField, string>>;

/** Ordem em que os campos aparecem na tela (usada para focar o primeiro erro). */
export const DONOR_FORM_FIELD_ORDER: DonorFormField[] = [
  'nome', 'cpf', 'idade', 'sexo', 'tipo_sanguineo', 'email', 'triagem', 'consentimento_lgpd',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida o formulário antes do envio para mostrar o erro junto do campo,
 * em vez de só num aviso temporário depois da resposta do servidor.
 * A API continua validando — isto não substitui a regra do servidor.
 */
export function validateDonorForm(values: DonorFormValues, { editing }: { editing: boolean }): DonorFormErrors {
  const errors: DonorFormErrors = {};

  if (!values.nome.trim()) errors.nome = 'Informe o nome completo do doador.';

  if (!editing) {
    const cpfDigits = values.cpf.replace(/\D/g, '');
    if (!cpfDigits) errors.cpf = 'Informe o CPF.';
    else if (cpfDigits.length !== 11) errors.cpf = `O CPF deve ter 11 dígitos (foram informados ${cpfDigits.length}).`;
  }

  const idade = Number(values.idade);
  if (!values.idade.trim()) errors.idade = 'Informe a idade.';
  else if (!Number.isInteger(idade) || idade < DONOR_ELIGIBILITY.minimumAge || idade > DONOR_ELIGIBILITY.maximumAge) {
    errors.idade = `A idade deve ser um número inteiro entre ${DONOR_ELIGIBILITY.minimumAge} e ${DONOR_ELIGIBILITY.maximumAge} anos.`;
  }

  if (!values.sexo) errors.sexo = 'Selecione o sexo.';
  if (!values.tipo_sanguineo) errors.tipo_sanguineo = 'Selecione o tipo sanguíneo.';
  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Informe um e-mail válido (ex.: nome@dominio.com) ou deixe em branco.';
  }

  if (!editing) {
    const pendentes = DONOR_SCREENING_CRITERIA.filter(c => !values[c.name]);
    if (pendentes.length > 0) {
      errors.triagem = `O doador só pode ser cadastrado se atender a todos os critérios de triagem (${pendentes.length} pendente${pendentes.length > 1 ? 's' : ''}).`;
    }
    if (!values.consentimento_lgpd) {
      errors.consentimento_lgpd = 'É necessário o consentimento do doador para o tratamento de dados pessoais (LGPD).';
    }
  }

  return errors;
}

/** Associa uma mensagem de erro da API ao campo correspondente, quando possível. */
export function fieldForApiError(detail: string): DonorFormField | null {
  const msg = detail.toLowerCase();
  if (msg.includes('cpf')) return 'cpf';
  if (msg.includes('idade')) return 'idade';
  if (msg.includes('consentimento')) return 'consentimento_lgpd';
  if (msg.includes('critério') || msg.includes('criterio') || msg.includes('elegib')) return 'triagem';
  if (msg.includes('tipo_sanguineo') || msg.includes('tipo sanguíneo')) return 'tipo_sanguineo';
  if (msg.includes('nome')) return 'nome';
  return null;
}
