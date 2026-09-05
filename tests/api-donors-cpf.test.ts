/**
 * Teste de regressão para Issue #3:
 * Validação de CPF no cadastro de doadores.
 *
 * Antes da correção: aceitava qualquer string (emojis, letras, símbolos).
 * Após a correção: rejeita com 400 se CPF não contém exatamente 11 dígitos.
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

import handler from '../pages/api/donors/index';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

const basePayload = {
  nome: 'Teste',
  tipo_sanguineo: 'A_POSITIVO',
  idade: 30,
  sexo: 'Masculino',
  condicao_1: true,
  condicao_2: true,
  condicao_3: true,
};

describe('POST /api/donors — validação de CPF (Issue #3)', () => {
  beforeEach(() => {
    mockSupabaseFetch.mockReset();
  });

  it('deve rejeitar CPF com emojis', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, cpf: '😀😀😀' },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'CPF deve conter 11 dígitos' });
    expect(mockSupabaseFetch).not.toHaveBeenCalled();
  });

  it('deve rejeitar CPF com letras', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, cpf: 'abc.def.ghi-jk' },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'CPF deve conter 11 dígitos' });
  });

  it('deve rejeitar CPF com símbolos diversos', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, cpf: '!@#$%&*()_+' },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'CPF deve conter 11 dígitos' });
  });

  it('deve rejeitar CPF com poucos dígitos', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, cpf: '123.456' },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'CPF deve conter 11 dígitos' });
  });

  it('deve rejeitar CPF com muitos dígitos', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, cpf: '123.456.789-00-999' },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'CPF deve conter 11 dígitos' });
  });

  it('deve rejeitar CPF vazio', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, cpf: '' },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'cpf é obrigatório' });
  });

  it('deve aceitar CPF válido com máscara', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id_doador: 'test-uuid' }],
    });

    const req: any = {
      method: 'POST',
      body: { ...basePayload, cpf: '123.456.789-09' },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('deve aceitar CPF válido sem máscara', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id_doador: 'test-uuid' }],
    });

    const req: any = {
      method: 'POST',
      body: { ...basePayload, cpf: '12345678909' },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
