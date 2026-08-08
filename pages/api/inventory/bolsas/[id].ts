import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, getServiceHeaders } from '../../../../src/lib/supabase';
import { requireAuth } from '../../../../src/lib/auth-helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  const { query } = req;
  const id = query.id as string;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ detail: 'Método não permitido' });
  }

  const check = await supabaseFetch(
    `/rest/v1/doacoes?id_doacao=eq.${encodeURIComponent(id)}&status=eq.EM_ESTOQUE&select=id_doacao&limit=1`,
    { method: 'GET' }
  );
  if (!check.ok) {
    return res.status(502).json({ detail: 'Erro ao verificar bolsa' });
  }
  const found: { id_doacao: string }[] = await check.json();
  if (found.length === 0) {
    return res.status(404).json({ detail: 'Bolsa não encontrada ou não está em estoque' });
  }

  const serviceRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/doacoes?id_doacao=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: getServiceHeaders() }
  );

  if (!serviceRes.ok) {
    const errText = await serviceRes.text();
    return res.status(502).json({ detail: `Erro ao remover bolsa: ${errText}` });
  }

  return res.status(204).end();
}
