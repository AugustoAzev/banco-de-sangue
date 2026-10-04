/**
 * TP4 — Funcionalidade 1: saída de bolsas (despacho/descarte) e histórico de movimentações.
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

import { parseStockExit, buildMovements, STOCK_EXIT_NOTE_MAX_LENGTH } from '../src/lib/stock-movements';
import saidasHandler from '../pages/api/inventory/saidas';
import movimentacoesHandler from '../pages/api/inventory/movimentacoes';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
};

describe('parseStockExit', () => {
  const base = { tipo_sangue: 'O_POSITIVO', quantidade: 2, status: 'DESPACHADA' };

  it('aceita um despacho sem observação', () => {
    expect(parseStockExit(base)).toEqual({ data: { ...base, observacoes: null } });
  });

  it('exige o motivo no descarte', () => {
    expect(parseStockExit({ ...base, status: 'DESCARTADA' })).toEqual({ error: 'Informe o motivo do descarte' });
    expect(parseStockExit({ ...base, status: 'DESCARTADA', observacoes: '  ' })).toHaveProperty('error');
    expect(parseStockExit({ ...base, status: 'DESCARTADA', observacoes: ' Vencida ' }))
      .toEqual({ data: { ...base, status: 'DESCARTADA', observacoes: 'Vencida' } });
  });

  it.each([
    [{ tipo_sangue: 'Z_POSITIVO' }, /tipo_sangue/],
    [{ quantidade: 0 }, /quantidade/],
    [{ quantidade: 1.5 }, /quantidade/],
    [{ quantidade: '2' }, /quantidade/],
    [{ status: 'EM_ESTOQUE' }, /status/],
    [{ observacoes: 'x'.repeat(STOCK_EXIT_NOTE_MAX_LENGTH + 1) }, /no máximo/],
  ])('rejeita %o', (override, msg) => {
    const result = parseStockExit({ ...base, ...override });
    expect('error' in result && result.error).toMatch(msg);
  });
});

describe('POST /api/inventory/saidas', () => {
  beforeEach(() => mockSupabaseFetch.mockReset());

  it('dá saída nas bolsas mais antigas do tipo e preserva o registro (PATCH, não DELETE)', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id_doacao: 'b1' }, { id_doacao: 'b2' }] });
    let patchUrl = '';
    let patchOpts: any = null;
    global.fetch = jest.fn().mockImplementation((url, opts) => {
      patchUrl = url;
      patchOpts = opts;
      return Promise.resolve({ ok: true, json: async () => [{}, {}] });
    });

    const res = mockRes();
    await saidasHandler({
      method: 'POST',
      body: { tipo_sangue: 'O_POSITIVO', quantidade: 2, status: 'DESPACHADA', observacoes: 'Hospital Regional' },
    } as any, res);

    expect(mockSupabaseFetch.mock.calls[0][0]).toContain('order=data_doacao.asc');
    expect(mockSupabaseFetch.mock.calls[0][0]).toContain('limit=2');
    expect(patchOpts.method).toBe('PATCH');
    expect(patchUrl).toContain('id_doacao=in.(b1,b2)');
    expect(patchUrl).toContain('status=eq.EM_ESTOQUE');
    expect(JSON.parse(patchOpts.body)).toMatchObject({ status: 'DESPACHADA', observacoes: 'Hospital Regional' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ quantidade: 2, status: 'DESPACHADA' }));
  });

  it('recusa quando não há bolsas suficientes do tipo', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id_doacao: 'b1' }] });
    global.fetch = jest.fn();
    const res = mockRes();

    await saidasHandler({ method: 'POST', body: { tipo_sangue: 'O_NEGATIVO', quantidade: 3, status: 'DESPACHADA' } } as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Há apenas 1 bolsa(s) de O- em estoque' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('não sobrescreve observacoes quando o despacho não tem observação', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id_doacao: 'b1' }] });
    let body: any = null;
    global.fetch = jest.fn().mockImplementation((_u, opts) => {
      body = JSON.parse(opts.body);
      return Promise.resolve({ ok: true, json: async () => [{}] });
    });
    const res = mockRes();

    await saidasHandler({ method: 'POST', body: { tipo_sangue: 'A_POSITIVO', quantidade: 1, status: 'DESPACHADA' } } as any, res);

    expect(body).not.toHaveProperty('observacoes');
  });

  it('valida o corpo antes de consultar o banco', async () => {
    const res = mockRes();
    await saidasHandler({ method: 'POST', body: { tipo_sangue: 'A_POSITIVO', quantidade: 1, status: 'DESCARTADA' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSupabaseFetch).not.toHaveBeenCalled();
  });

  it('aceita apenas POST', async () => {
    const res = mockRes();
    await saidasHandler({ method: 'GET' } as any, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe('buildMovements', () => {
  const entradaEm = '2026-10-04T13:00:00.000Z';
  const saidaEm = '2026-10-04T15:30:00.000Z';

  it('agrupa uma entrada de várias bolsas e a saída posterior de parte delas', () => {
    const rows = [
      { tipo_sanguineo_coletado: 'O_POSITIVO', status: 'DESPACHADA', data_doacao: entradaEm, atualizado_em: saidaEm, observacoes: 'Hospital X' },
      { tipo_sanguineo_coletado: 'O_POSITIVO', status: 'DESPACHADA', data_doacao: entradaEm, atualizado_em: saidaEm, observacoes: 'Hospital X' },
      { tipo_sanguineo_coletado: 'O_POSITIVO', status: 'EM_ESTOQUE', data_doacao: entradaEm, atualizado_em: entradaEm },
    ];

    expect(buildMovements(rows)).toEqual([
      { tipo: 'DESPACHADA', tipo_sangue: 'O_POSITIVO', quantidade: 2, data: saidaEm, observacoes: 'Hospital X' },
      { tipo: 'ENTRADA', tipo_sangue: 'O_POSITIVO', quantidade: 3, data: entradaEm, observacoes: null },
    ]);
  });

  it('separa tipos sanguíneos diferentes registrados no mesmo instante', () => {
    const rows = [
      { tipo_sanguineo_coletado: 'A_POSITIVO', status: 'EM_ESTOQUE', data_doacao: entradaEm, atualizado_em: entradaEm },
      { tipo_sanguineo_coletado: 'B_POSITIVO', status: 'EM_ESTOQUE', data_doacao: entradaEm, atualizado_em: entradaEm },
    ];
    expect(buildMovements(rows)).toHaveLength(2);
  });

  it('ordena da mais recente para a mais antiga e respeita o limite', () => {
    const rows = ['2026-10-01', '2026-10-03', '2026-10-02'].map(d => ({
      tipo_sanguineo_coletado: 'A_POSITIVO', status: 'EM_ESTOQUE', data_doacao: `${d}T10:00:00Z`, atualizado_em: `${d}T10:00:00Z`,
    }));
    const result = buildMovements(rows, 2);
    expect(result.map(m => m.data.slice(0, 10))).toEqual(['2026-10-03', '2026-10-02']);
  });
});

describe('GET /api/inventory/movimentacoes', () => {
  beforeEach(() => mockSupabaseFetch.mockReset());

  it('limita o parâmetro `limite` a 50', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    const res = mockRes();
    await movimentacoesHandler({ method: 'GET', query: { limite: '999' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  it('retorna 502 quando o banco falha', async () => {
    mockSupabaseFetch.mockResolvedValueOnce({ ok: false });
    const res = mockRes();
    await movimentacoesHandler({ method: 'GET', query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });
});
