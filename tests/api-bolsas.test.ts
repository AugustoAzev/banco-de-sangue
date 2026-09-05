/**
 * Teste de regressão para Issue #1:
 * Bolsas agrupadas devem retornar um id real (não 0).
 *
 * Antes da correção: id era sempre 0 para todas as entradas,
 * impedindo o frontend de excluir bolsas individuais.
 *
 * Após a correção: id é o id da primeira bolsa do grupo.
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

import handler from '../pages/api/inventory/bolsas';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

describe('GET /api/inventory/bolsas — agrupamento por tipo sanguíneo', () => {
  beforeEach(() => {
    mockSupabaseFetch.mockReset();
  });

  it('deve retornar id real (não 0) para bolsas agrupadas', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id_doacao: 'uuid-a-positivo-1', tipo_sanguineo_coletado: 'A_POSITIVO', data_doacao: '2024-01-15T10:00:00Z' },
        { id_doacao: 'uuid-a-positivo-2', tipo_sanguineo_coletado: 'A_POSITIVO', data_doacao: '2024-01-14T10:00:00Z' },
        { id_doacao: 'uuid-o-negativo-1', tipo_sanguineo_coletado: 'O_NEGATIVO', data_doacao: '2024-01-13T10:00:00Z' },
      ],
    });

    const req: any = {
      method: 'GET',
      url: '/api/inventory/bolsas',
      query: {},
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.json.mock.calls[0][0];

    // Verifica que os ids não são mais 0
    expect(result).toHaveLength(2);

    const aPositivo = result.find((b: any) => b.tipo_sangue === 'A_POSITIVO');
    const oNegativo = result.find((b: any) => b.tipo_sangue === 'O_NEGATIVO');

    expect(aPositivo).toBeDefined();
    expect(aPositivo.id).not.toBe(0);
    expect(['uuid-a-positivo-1', 'uuid-a-positivo-2']).toContain(aPositivo.id);
    expect(aPositivo.quantidade).toBe(2);

    expect(oNegativo).toBeDefined();
    expect(oNegativo.id).toBe('uuid-o-negativo-1');
    expect(oNegativo.quantidade).toBe(1);
  });

  it('deve retornar lista vazia quando não há bolsas em estoque', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const req: any = {
      method: 'GET',
      url: '/api/inventory/bolsas',
      query: {},
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('deve filtrar por tipo sanguíneo quando query param é fornecido', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id_doacao: 'uuid-only', tipo_sanguineo_coletado: 'A_POSITIVO', data_doacao: '2024-01-15T10:00:00Z' },
      ],
    });

    const req: any = {
      method: 'GET',
      url: '/api/inventory/bolsas?tipo_sangue=A_POSITIVO',
      query: { tipo_sangue: 'A_POSITIVO' },
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.json.mock.calls[0][0];
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('uuid-only');
  });
});
