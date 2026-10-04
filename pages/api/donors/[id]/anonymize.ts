import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, getServiceHeaders } from '../../../../src/lib/supabase';
import { requireAuth } from '../../../../src/lib/auth-helpers';
import type { Doador } from '../../../../src/lib/types';
import { isGenericDonor, GENERIC_DONOR_PROTECTED_MESSAGE } from '../../../../src/lib/system-records';

const CAMPOS_ANONIMIZADOS = {
  nome_completo: 'Doador Anonimizado (LGPD)',
  cpf: null,
  email: null,
  telefone: null,
  endereco: null,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  if (req.method !== 'PATCH') {
    return res.status(405).json({ detail: 'Método não permitido' });
  }

  const { query } = req;
  const id = query.id as string;

  const check = await supabaseFetch(
    `/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}&select=id_doador,cpf,anonimizado_em&limit=1`,
    { method: 'GET' }
  );
  if (!check.ok) {
    return res.status(502).json({ detail: 'Erro ao verificar doador' });
  }
  const found: Pick<Doador, 'id_doador' | 'cpf' | 'anonimizado_em'>[] = await check.json();
  if (found.length === 0) {
    return res.status(404).json({ detail: 'Doador não encontrado' });
  }
  // Anonimizar o doador genérico removeria o CPF usado para localizar o registro
  // nas entradas manuais de estoque, quebrando o cadastro de novas bolsas.
  if (isGenericDonor(found[0])) {
    return res.status(409).json({ detail: GENERIC_DONOR_PROTECTED_MESSAGE });
  }

  // Idempotente: se já foi anonimizado antes, não sobrescreve o timestamp original.
  if (found[0].anonimizado_em) {
    return res.status(200).json(found[0]);
  }

  const payload = {
    ...CAMPOS_ANONIMIZADOS,
    anonimizado_em: new Date().toISOString(),
  };

  const serviceRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: getServiceHeaders(), body: JSON.stringify(payload) }
  );

  if (!serviceRes.ok) {
    const errText = await serviceRes.text();
    return res.status(502).json({ detail: `Erro ao anonimizar doador: ${errText}` });
  }

  const updated: Doador[] = await serviceRes.json();
  return res.status(200).json(updated[0] ?? {});
}
