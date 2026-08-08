import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, getServiceHeaders } from '../../../src/lib/supabase';
import { requireAuth } from '../../../src/lib/auth-helpers';
import type { Insumo } from '../../../src/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  const { query } = req;
  const id = query.id as string;

  if (req.method === 'PUT') {
    const body = req.body as Partial<{ nome: string; quantidade: number }>;

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ detail: 'Nenhum campo para atualizar' });
    }
    if (body.nome !== undefined && !body.nome) {
      return res.status(400).json({ detail: 'nome não pode ser vazio' });
    }
    if (body.quantidade !== undefined && body.quantidade < 0) {
      return res.status(400).json({ detail: 'quantidade não pode ser negativa' });
    }

    const check = await supabaseFetch(
      `/rest/v1/insumos?id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
      { method: 'GET' }
    );
    if (!check.ok) {
      return res.status(502).json({ detail: 'Erro ao verificar insumo' });
    }
    const found: { id: number }[] = await check.json();
    if (found.length === 0) {
      return res.status(404).json({ detail: 'Insumo não encontrado' });
    }

    const payload: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
    if (body.nome !== undefined) payload.nome = body.nome;
    if (body.quantidade !== undefined) payload.quantidade = body.quantidade;

    const serviceRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/insumos?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { ...getServiceHeaders(), 'Prefer': 'return=representation' },
        body: JSON.stringify(payload),
      }
    );

    if (!serviceRes.ok) {
      const errText = await serviceRes.text();
      return res.status(502).json({ detail: `Erro ao atualizar insumo: ${errText}` });
    }

    const updated: Insumo[] = await serviceRes.json();
    return res.status(200).json(updated[0] ?? {});
  }

  if (req.method === 'DELETE') {
    const check = await supabaseFetch(
      `/rest/v1/insumos?id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
      { method: 'GET' }
    );
    if (!check.ok) {
      return res.status(502).json({ detail: 'Erro ao verificar insumo' });
    }
    const found: { id: number }[] = await check.json();
    if (found.length === 0) {
      return res.status(404).json({ detail: 'Insumo não encontrado' });
    }

    const serviceRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/insumos?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: getServiceHeaders() }
    );

    if (!serviceRes.ok) {
      const errText = await serviceRes.text();
      return res.status(502).json({ detail: `Erro ao excluir insumo: ${errText}` });
    }

    return res.status(204).end();
  }

  return res.status(405).json({ detail: 'Método não permitido' });
}
