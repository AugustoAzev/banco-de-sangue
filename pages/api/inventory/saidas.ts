import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, getServiceHeaders } from '../../../src/lib/supabase';
import { requireAuth } from '../../../src/lib/auth-helpers';
import { parseStockExit } from '../../../src/lib/stock-movements';
import { formatBloodType } from '../../../src/lib/blood-types';

/**
 * POST /api/inventory/saidas — registra a saída (despacho ou descarte) de bolsas.
 * As bolsas mais antigas do tipo saem primeiro (FIFO), reduzindo o risco de vencimento.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Método não permitido' });
  }

  const parsed = parseStockExit(req.body);
  if ('error' in parsed) return res.status(400).json({ detail: parsed.error });
  const { tipo_sangue, quantidade, status, observacoes } = parsed.data;

  const disponiveisRes = await supabaseFetch(
    `/rest/v1/doacoes?status=eq.EM_ESTOQUE&tipo_sanguineo_coletado=eq.${encodeURIComponent(tipo_sangue)}` +
      `&select=id_doacao&order=data_doacao.asc&limit=${quantidade}`,
    { method: 'GET' }
  );
  if (!disponiveisRes.ok) {
    return res.status(502).json({ detail: 'Erro ao consultar o estoque' });
  }
  const disponiveis: { id_doacao: string }[] = await disponiveisRes.json();
  if (disponiveis.length < quantidade) {
    return res.status(400).json({
      detail: `Há apenas ${disponiveis.length} bolsa(s) de ${formatBloodType(tipo_sangue)} em estoque`,
    });
  }

  const ids = disponiveis.map(d => encodeURIComponent(d.id_doacao)).join(',');
  const payload: Record<string, unknown> = { status, atualizado_em: new Date().toISOString() };
  // `observacoes` passa a registrar o destino/motivo da saída. Nas bolsas lançadas
  // pelo sistema o campo vem vazio na entrada; só é sobrescrito se houver texto.
  if (observacoes) payload.observacoes = observacoes;

  // O filtro status=EM_ESTOQUE evita dar saída duas vezes na mesma bolsa
  // caso outra pessoa registre uma saída ao mesmo tempo.
  const updateRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/doacoes?id_doacao=in.(${ids})&status=eq.EM_ESTOQUE`,
    { method: 'PATCH', headers: getServiceHeaders(), body: JSON.stringify(payload) }
  );
  if (!updateRes.ok) {
    const errText = await updateRes.text();
    return res.status(502).json({ detail: `Erro ao registrar saída: ${errText}` });
  }

  const atualizadas: unknown[] = await updateRes.json();
  return res.status(200).json({ tipo_sangue, status, quantidade: atualizadas.length, observacoes });
}
