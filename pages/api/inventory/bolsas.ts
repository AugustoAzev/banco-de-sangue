import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, getServiceHeaders } from '../_lib/supabase';
import { requireAuth } from '../_lib/auth-helpers';
import { randomUUID } from 'crypto';
import type { Bolsa, BolsaCreate } from '../_lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  if (req.method === 'GET') {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const tipoSangue = searchParams.get('tipo_sangue');

    let path = '/rest/v1/doacoes?status=eq.EM_ESTOQUE&select=id_doacao,tipo_sanguineo_coletado,data_doacao&order=data_doacao.desc';
    if (tipoSangue) {
      path += `&tipo_sanguineo_coletado=eq.${encodeURIComponent(tipoSangue)}`;
    }

    const response = await supabaseFetch(path, { method: 'GET' });
    if (!response.ok) {
      return res.status(502).json({ detail: 'Erro ao buscar bolsas em estoque' });
    }

    const rows: { id_doacao: string; tipo_sanguineo_coletado: string; data_doacao: string }[] = await response.json();

    const grouped: Record<string, { id: string; tipo_sangue: string; created_at: string }[]> = {};
    for (const row of rows) {
      if (!grouped[row.tipo_sanguineo_coletado]) {
        grouped[row.tipo_sanguineo_coletado] = [];
      }
      grouped[row.tipo_sanguineo_coletado].push({
        id: row.id_doacao,
        tipo_sangue: row.tipo_sanguineo_coletado,
        created_at: row.data_doacao,
      });
    }

    const result: Bolsa[] = Object.entries(grouped).map(([tipo_sangue, bolsas]) => ({
      id: 0,
      tipo_sangue,
      quantidade: bolsas.length,
      created_at: bolsas[0]?.created_at,
    }));

    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const body = req.body as BolsaCreate;
    const { tipo_sangue, quantidade } = body;

    if (!tipo_sangue) return res.status(400).json({ detail: 'tipo_sangue é obrigatório' });
    if (!quantidade || quantidade < 1) return res.status(400).json({ detail: 'quantidade deve ser >= 1' });

    const donorRes = await supabaseFetch(
      `/rest/v1/doadores?cpf=eq.000.000.000-00&select=id_doador&limit=1`,
      { method: 'GET' }
    );
    if (!donorRes.ok) {
      return res.status(502).json({ detail: 'Erro ao buscar doador genérico' });
    }
    const donors: { id_doador: string }[] = await donorRes.json();
    if (donors.length === 0) {
      return res.status(400).json({ detail: 'Doador genérico (cpf=000.000.000-00) não encontrado' });
    }
    const id_doador = donors[0].id_doador;

    const ucRes = await supabaseFetch(
      `/rest/v1/unidades_coleta?select=id_unidade&order=id_unidade.asc&limit=1`,
      { method: 'GET' }
    );
    if (!ucRes.ok) {
      return res.status(502).json({ detail: 'Erro ao buscar unidade de coleta' });
    }
    const ucs: { id_unidade: string }[] = await ucRes.json();
    if (ucs.length === 0) {
      return res.status(400).json({ detail: 'Nenhuma unidade de coleta cadastrada' });
    }
    const id_unidade = ucs[0].id_unidade;

    const now = new Date().toISOString();

    const bolsaPayloads = Array.from({ length: quantidade }, () => ({
      id_doacao: randomUUID(),
      id_doador,
      id_unidade,
      tipo_sanguineo_coletado: tipo_sangue,
      volume_ml: 450,
      status: 'EM_ESTOQUE',
      id_registrador: auth.user!.sub,
      criado_em: now,
      atualizado_em: now,
    }));

    const serviceRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/doacoes`, {
      method: 'POST',
      headers: getServiceHeaders(),
      body: JSON.stringify(bolsaPayloads),
    });

    if (!serviceRes.ok) {
      const errText = await serviceRes.text();
      return res.status(502).json({ detail: `Erro ao registrar bolsas: ${errText}` });
    }

    const created = await serviceRes.json();
    return res.status(201).json({ registradas: created.length, bolsas: created });
  }

  return res.status(405).json({ detail: 'Método não permitido' });
}
