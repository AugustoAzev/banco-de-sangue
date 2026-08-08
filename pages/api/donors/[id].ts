import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, getServiceHeaders } from '../_lib/supabase';
import { requireAuth } from '../_lib/auth-helpers';
import type { Doador } from '../_lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  const { query } = req;
  const id = query.id as string;

  if (req.method === 'PUT') {
    const body = req.body as Partial<{
      nome: string;
      tipo_sanguineo: string;
      idade: number;
      sexo: string;
      email: string;
      telefone: string;
      endereco: string;
    }>;

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ detail: 'Nenhum campo para atualizar' });
    }

    const check = await supabaseFetch(
      `/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}&select=id_doador&limit=1`,
      { method: 'GET' }
    );
    if (!check.ok) {
      return res.status(502).json({ detail: 'Erro ao verificar doador' });
    }
    const found: Doador[] = await check.json();
    if (found.length === 0) {
      return res.status(404).json({ detail: 'Doador não encontrado' });
    }

    const payload: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
    if (body.nome !== undefined) payload.nome_completo = body.nome;
    if (body.tipo_sanguineo !== undefined) payload.tipo_sanguineo = body.tipo_sanguineo;
    if (body.idade !== undefined) payload.idade = body.idade;
    if (body.sexo !== undefined) payload.sexo = body.sexo;
    if (body.email !== undefined) payload.email = body.email;
    if (body.telefone !== undefined) payload.telefone = body.telefone;
    if (body.endereco !== undefined) payload.endereco = body.endereco;

    const serviceRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers: getServiceHeaders(), body: JSON.stringify(payload) }
    );

    if (!serviceRes.ok) {
      const errText = await serviceRes.text();
      return res.status(502).json({ detail: `Erro ao atualizar doador: ${errText}` });
    }

    const updated: Doador[] = await serviceRes.json();
    return res.status(200).json(updated[0] ?? {});
  }

  if (req.method === 'DELETE') {
    const check = await supabaseFetch(
      `/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}&select=id_doador&limit=1`,
      { method: 'GET' }
    );
    if (!check.ok) {
      return res.status(502).json({ detail: 'Erro ao verificar doador' });
    }
    const found: Doador[] = await check.json();
    if (found.length === 0) {
      return res.status(404).json({ detail: 'Doador não encontrado' });
    }

    const donationCheck = await supabaseFetch(
      `/rest/v1/doacoes?id_doador=eq.${encodeURIComponent(id)}&select=id_doacao&limit=1`,
      { method: 'GET' }
    );
    if (donationCheck.ok) {
      const donations: { id_doacao: string }[] = await donationCheck.json();
      if (donations.length > 0) {
        return res.status(400).json({ detail: 'Doador possui doações associadas e não pode ser excluído' });
      }
    }

    const serviceRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: getServiceHeaders() }
    );

    if (!serviceRes.ok) {
      const errText = await serviceRes.text();
      return res.status(502).json({ detail: `Erro ao excluir doador: ${errText}` });
    }

    return res.status(204).end();
  }

  return res.status(405).json({ detail: 'Método não permitido' });
}
