/**
 * Testes de regressão para a adaptação LGPD (Lei 13.709/2018):
 * - POST /api/donors exige consentimento explícito do doador.
 * - PATCH /api/donors/[id]/anonymize anonimiza dados pessoais identificáveis
 *   em vez de excluir o registro (histórico de doações tem retenção legal).
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

jest.mock('crypto', () => ({
  randomUUID: () => 'test-uuid',
}));

import donorsHandler from '../pages/api/donors/index';
import anonymizeHandler from '../pages/api/donors/[id]/anonymize';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

const basePayload = {
  nome: 'Teste',
  cpf: '123.456.789-09',
  tipo_sanguineo: 'A_POSITIVO',
  idade: 30,
  sexo: 'Masculino',
  condicao_1: true,
  condicao_2: true,
  condicao_3: true,
};

describe('POST /api/donors — consentimento LGPD', () => {
  beforeEach(() => {
    mockSupabaseFetch.mockReset();
  });

  it('deve rejeitar cadastro sem consentimento_lgpd', async () => {
    const req: any = { method: 'POST', body: { ...basePayload } };
    const res = mockRes();

    await donorsHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      detail: 'É necessário o consentimento do doador para o tratamento de dados pessoais (LGPD)',
    });
    expect(mockSupabaseFetch).not.toHaveBeenCalled();
  });

  it('deve aceitar cadastro com consentimento_lgpd e registrar o timestamp', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    let sentBody: any = null;
    global.fetch = jest.fn().mockImplementation((_url, opts) => {
      sentBody = JSON.parse(opts.body);
      return Promise.resolve({ ok: true, json: async () => [sentBody] });
    });

    const req: any = { method: 'POST', body: { ...basePayload, consentimento_lgpd: true } };
    const res = mockRes();

    await donorsHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(sentBody.consentimento_lgpd).toBe(true);
    expect(sentBody.consentimento_lgpd_em).toEqual(expect.any(String));
  });
});

describe('PATCH /api/donors/[id]/anonymize', () => {
  beforeEach(() => {
    mockSupabaseFetch.mockReset();
  });

  it('deve retornar 404 se o doador não existir', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const req: any = { method: 'PATCH', query: { id: 'inexistente' } };
    const res = mockRes();

    await anonymizeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deve anonimizar nome, cpf, email, telefone e endereço, mantendo tipo_sanguineo', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id_doador: 'd1', anonimizado_em: null }],
    });
    let sentBody: any = null;
    global.fetch = jest.fn().mockImplementation((_url, opts) => {
      sentBody = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        json: async () => [{ id_doador: 'd1', tipo_sanguineo: 'A_POSITIVO', ...sentBody }],
      });
    });

    const req: any = { method: 'PATCH', query: { id: 'd1' } };
    const res = mockRes();

    await anonymizeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(sentBody.nome_completo).toBe('Doador Anonimizado (LGPD)');
    expect(sentBody.cpf).toBeNull();
    expect(sentBody.email).toBeNull();
    expect(sentBody.telefone).toBeNull();
    expect(sentBody.endereco).toBeNull();
    expect(sentBody.anonimizado_em).toEqual(expect.any(String));
    expect('tipo_sanguineo' in sentBody).toBe(false);
  });

  it('deve ser idempotente: não sobrescreve doador já anonimizado', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id_doador: 'd1', anonimizado_em: '2026-01-01T00:00:00.000Z' }],
    });
    global.fetch = jest.fn();

    const req: any = { method: 'PATCH', query: { id: 'd1' } };
    const res = mockRes();

    await anonymizeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
