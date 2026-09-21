/**
 * Testes da Estratégia 3 (Migração/Integração de API Externa):
 * proxy GET /api/cep/[cep] -> ViaCEP (https://viacep.com.br).
 */

jest.mock('../src/lib/auth-helpers', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    authorized: true,
    user: { sub: 'admin@banco-sangue.com', role: 'ADMINISTRADOR', name: 'Admin' },
  }),
}));

import handler from '../pages/api/cep/[cep]';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('GET /api/cep/[cep]', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('deve rejeitar CEP com menos de 8 dígitos', async () => {
    const req: any = { method: 'GET', query: { cep: '123' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve consultar o ViaCEP e normalizar o endereço para CEP válido', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    });

    const req: any = { method: 'GET', query: { cep: '01310-100' } };
    const res = mockRes();

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });
  });

  it('deve retornar 404 quando o ViaCEP responde erro=true (CEP inexistente)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ erro: true }),
    });

    const req: any = { method: 'GET', query: { cep: '00000000' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deve retornar 502 se o ViaCEP estiver indisponível', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    const req: any = { method: 'GET', query: { cep: '01310100' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
  });
});
