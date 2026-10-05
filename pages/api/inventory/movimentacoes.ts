import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch } from '../../../src/lib/supabase';
import { requireAuth } from '../../../src/lib/auth-helpers';
import { buildMovements, type DonationRow } from '../../../src/lib/stock-movements';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;
// Linhas mais recentes consideradas para reconstruir as movimentações.
const ROWS_WINDOW = 500;

/** GET /api/inventory/movimentacoes?limite=8 — últimas entradas e saídas de bolsas. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  if (req.method !== 'GET') {
    return res.status(405).json({ detail: 'Método não permitido' });
  }

  const limiteParam = Number(req.query.limite ?? DEFAULT_LIMIT);
  const limite = Number.isInteger(limiteParam) && limiteParam > 0 ? Math.min(limiteParam, MAX_LIMIT) : DEFAULT_LIMIT;

  const response = await supabaseFetch(
    `/rest/v1/doacoes?select=tipo_sanguineo_coletado,status,data_doacao,atualizado_em,observacoes` +
      `&order=atualizado_em.desc&limit=${ROWS_WINDOW}`,
    { method: 'GET' }
  );
  if (!response.ok) {
    return res.status(502).json({ detail: 'Erro ao buscar movimentações do estoque' });
  }

  const rows: DonationRow[] = await response.json();
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(buildMovements(rows, limite));
}
