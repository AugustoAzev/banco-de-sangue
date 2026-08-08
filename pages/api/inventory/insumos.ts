import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, getServiceHeaders } from '../../../src/lib/supabase';
import { requireAuth } from '../../../src/lib/auth-helpers';
import type { Insumo, InsumoCreate } from '../../../src/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  if (req.method === 'GET') {
    const response = await supabaseFetch(
      '/rest/v1/insumos?select=*&order=id.asc',
      { method: 'GET' }
    );

    if (!response.ok) {
      return res.status(502).json({ detail: 'Erro ao buscar insumos' });
    }

    const insumos: Insumo[] = await response.json();
    return res.status(200).json(insumos);
  }

  if (req.method === 'POST') {
    const body = req.body as InsumoCreate;
    const { nome, quantidade } = body;

    if (!nome) return res.status(400).json({ detail: 'nome é obrigatório' });
    if (quantidade === undefined || quantidade === null) return res.status(400).json({ detail: 'quantidade é obrigatória' });
    if (quantidade < 0) return res.status(400).json({ detail: 'quantidade não pode ser negativa' });

    const now = new Date().toISOString();
    const payload = {
      nome,
      quantidade,
      criado_em: now,
      atualizado_em: now,
    };

    const serviceRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/insumos`, {
      method: 'POST',
      headers: getServiceHeaders(),
      body: JSON.stringify(payload),
    });

    if (!serviceRes.ok) {
      const errText = await serviceRes.text();
      return res.status(502).json({ detail: `Erro ao criar insumo: ${errText}` });
    }

    const created: Insumo[] = await serviceRes.json();
    return res.status(201).json(created[0] ?? payload);
  }

  return res.status(405).json({ detail: 'Método não permitido' });
}
