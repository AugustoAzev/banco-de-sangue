/**
 * Teste de regressão para Issue #2:
 * Validação de idade no cadastro de doadores.
 *
 * Antes da correção: aceitava qualquer inteiro (incluindo negativos, 0, > 69).
 * Após a correção: rejeita com 400 se idade < 16 ou > 69.
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
  cpf: '123.456.789-00',
  tipo_sanguineo: 'A_POSITIVO',
  sexo: 'Masculino',
  condicao_1: true,
  condicao_2: true,
  condicao_3: true,
};

describe('POST /api/donors — validação de idade (Issue #2)', () => {
  beforeEach(() => {
    mockSupabaseFetch.mockReset();
  });

  it('deve rejeitar idade negativa', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, idade: -50 },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'idade deve estar entre 16 e 69 anos' });
    expect(mockSupabaseFetch).not.toHaveBeenCalled();
  });

  it('deve rejeitar idade zero', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, idade: 0 },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'idade deve estar entre 16 e 69 anos' });
  });

  it('deve rejeitar idade abaixo do mínimo (15)', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, idade: 15 },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'idade deve estar entre 16 e 69 anos' });
  });

  it('deve rejeitar idade acima do máximo (70)', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, idade: 70 },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'idade deve estar entre 16 e 69 anos' });
  });

  it('deve rejeitar idade absurda (9999)', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload, idade: 9999 },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'idade deve estar entre 16 e 69 anos' });
  });

  it('deve aceitar idade válida (16) — limite inferior', async () => {
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
      body: { ...basePayload, idade: 16 },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('deve aceitar idade válida (69) — limite superior', async () => {
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
      body: { ...basePayload, idade: 69 },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('deve aceitar idade válida (30)', async () => {
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
      body: { ...basePayload, idade: 30 },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('deve rejeitar idade ausente (undefined)', async () => {
    const req: any = {
      method: 'POST',
      body: { ...basePayload }, // sem idade
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'idade é obrigatória' });
  });
});
