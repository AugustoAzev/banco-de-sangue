/**
 * TP4 — Redesign do cadastro de doadores.
 * - H9: erros mostrados junto do campo (validação antes do envio).
 * - H5: o doador genérico das entradas de estoque não pode ser alterado.
 */
const mockSupabaseFetch = jest.fn();

jest.mock('../src/lib/supabase', () => ({
  supabaseFetch: (...args) => mockSupabaseFetch(...args),
  getServiceHeaders: () => ({ apikey: 'test', Authorization: 'Bearer test' }),
}));

jest.mock('../src/lib/auth-helpers', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    authorized: true,
    user: { sub: 'admin@banco-sangue.com', role: 'ADMINISTRADOR', name: 'Admin' },
  }),
}));

import { validateDonorForm, fieldForApiError, type DonorFormValues } from '../src/lib/donor-form-validation';
import { isGenericDonor, GENERIC_DONOR_PROTECTED_MESSAGE } from '../src/lib/system-records';
import donorByIdHandler from '../pages/api/donors/[id]';
import anonymizeHandler from '../pages/api/donors/[id]/anonymize';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

const valido: DonorFormValues = {
  nome: 'Maria Oliveira', cpf: '111.444.777-35', idade: '28', sexo: 'Feminino',
  tipo_sanguineo: 'A_POSITIVO', email: '', condicao_1: true, condicao_2: true, condicao_3: true,
  consentimento_lgpd: true,
};

describe('validateDonorForm', () => {
  it('aceita um cadastro completo', () => {
    expect(validateDonorForm(valido, { editing: false })).toEqual({});
  });

  it('indica o CPF incompleto com a quantidade de dígitos informada', () => {
    const errors = validateDonorForm({ ...valido, cpf: '123' }, { editing: false });
    expect(errors.cpf).toMatch(/11 dígitos/);
    expect(errors.cpf).toMatch(/3/);
  });

  it('valida a idade com os limites da política de elegibilidade', () => {
    expect(validateDonorForm({ ...valido, idade: '15' }, { editing: false }).idade).toMatch(/16 e 69/);
    expect(validateDonorForm({ ...valido, idade: '70' }, { editing: false }).idade).toBeDefined();
    expect(validateDonorForm({ ...valido, idade: '' }, { editing: false }).idade).toBe('Informe a idade.');
  });

  it('exige todos os critérios de triagem e o consentimento no cadastro', () => {
    const errors = validateDonorForm({ ...valido, condicao_2: false, consentimento_lgpd: false }, { editing: false });
    expect(errors.triagem).toMatch(/1 pendente/);
    expect(errors.consentimento_lgpd).toBeDefined();
  });

  it('na edição não revalida CPF, triagem nem consentimento (campos não exibidos)', () => {
    const errors = validateDonorForm(
      { ...valido, cpf: '', condicao_1: false, consentimento_lgpd: false }, { editing: true },
    );
    expect(errors).toEqual({});
  });

  it('aceita e-mail vazio mas rejeita e-mail malformado', () => {
    expect(validateDonorForm({ ...valido, email: '' }, { editing: false }).email).toBeUndefined();
    expect(validateDonorForm({ ...valido, email: 'maria@' }, { editing: false }).email).toBeDefined();
  });
});

describe('fieldForApiError', () => {
  it('associa mensagens da API ao campo correspondente', () => {
    expect(fieldForApiError('CPF já cadastrado')).toBe('cpf');
    expect(fieldForApiError('idade deve ser um número inteiro entre 16 e 69 anos')).toBe('idade');
    expect(fieldForApiError('Erro interno')).toBeNull();
  });
});

describe('doador genérico das entradas de estoque', () => {
  beforeEach(() => mockSupabaseFetch.mockReset());

  it('é reconhecido com ou sem máscara no CPF', () => {
    expect(isGenericDonor({ cpf: '000.000.000-00' })).toBe(true);
    expect(isGenericDonor({ cpf: '00000000000' })).toBe(true);
    expect(isGenericDonor({ cpf: '111.444.777-35' })).toBe(false);
    expect(isGenericDonor({ cpf: null })).toBe(false);
  });

  it.each([
    ['PUT', donorByIdHandler, { nome: 'Outro nome' }],
    ['DELETE', donorByIdHandler, undefined],
    ['PATCH', anonymizeHandler, undefined],
  ])('%s é recusado com 409', async (method, handler, body) => {
    mockSupabaseFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id_doador: 'generico', cpf: '000.000.000-00', anonimizado_em: null }],
    });
    global.fetch = jest.fn();
    const res = mockRes();

    await (handler as any)({ method, query: { id: 'generico' }, body }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ detail: GENERIC_DONOR_PROTECTED_MESSAGE });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
