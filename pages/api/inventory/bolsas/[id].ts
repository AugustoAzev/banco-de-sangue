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

  // A lista de estoque agrupa doações por tipo sanguíneo e o botão é "Excluir
  // Lote". O id recebido é o da primeira bolsa do grupo — usamos ele só para
  // descobrir o tipo e então remover o LOTE inteiro (todas EM_ESTOQUE do tipo),
  // coerente com o rótulo e a quantidade exibida.
  const check = await supabaseFetch(
    `/rest/v1/doacoes?id_doacao=eq.${encodeURIComponent(id)}&status=eq.EM_ESTOQUE&select=id_doacao,tipo_sanguineo_coletado&limit=1`,
    { method: 'GET' }
  );
  if (!check.ok) {
    return res.status(502).json({ detail: 'Erro ao verificar bolsa' });
  }
  const found: { id_doacao: string; tipo_sanguineo_coletado: string }[] = await check.json();
  if (found.length === 0) {
    return res.status(404).json({ detail: 'Bolsa não encontrada ou não está em estoque' });
  }

  const tipo = found[0].tipo_sanguineo_coletado;

  const serviceRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/doacoes?tipo_sanguineo_coletado=eq.${encodeURIComponent(tipo)}&status=eq.EM_ESTOQUE`,
    { method: 'DELETE', headers: getServiceHeaders() }
  );

  if (!serviceRes.ok) {
    const errText = await serviceRes.text();
    return res.status(502).json({ detail: `Erro ao remover lote: ${errText}` });
  }

  return res.status(204).end();
}
