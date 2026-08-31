import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, getServiceHeaders } from '../../../src/lib/supabase';
import { requireAuth } from '../../../src/lib/auth-helpers';
import { randomUUID } from 'crypto';
import type { DoadorCreate, Doador } from '../../../src/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  if (req.method === 'GET') {
    const { searchParams } = new URL(req.url!, 'http://localhost');
    const query = searchParams.get('query') ?? '';

    let path = '/rest/v1/doadores?select=*&order=nome_completo.asc';

    if (query) {
      const encoded = encodeURIComponent(query);
      path += `&or=(nome_completo.ilike.*${encoded}*,cpf.ilike.*${encoded}*)`;
    }

    const response = await supabaseFetch(path, { method: 'GET' });

    if (!response.ok) {
      return res.status(502).json({ detail: 'Erro ao buscar doadores' });
    }

    const donors: Doador[] = await response.json();
    return res.status(200).json(donors);
  }

  if (req.method === 'POST') {
    const body = req.body as DoadorCreate;
    const { nome, cpf, tipo_sanguineo, idade, sexo, condicao_1, condicao_2, condicao_3 } = body;

    if (!nome) return res.status(400).json({ detail: 'nome é obrigatório' });
    if (!cpf) return res.status(400).json({ detail: 'cpf é obrigatório' });
    // CPF deve conter apenas dígitos (com ou sem máscara)
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      return res.status(400).json({ detail: 'CPF deve conter 11 dígitos' });
    }
    if (!tipo_sanguineo) return res.status(400).json({ detail: 'tipo_sanguineo é obrigatório' });
    if (idade === undefined || idade === null) return res.status(400).json({ detail: 'idade é obrigatória' });
    if (!sexo) return res.status(400).json({ detail: 'sexo é obrigatório' });
    if (!condicao_1 || !condicao_2 || !condicao_3) {
      return res.status(400).json({ detail: 'Doador não atende aos critérios de triagem' });
    }

    const cpfCheck = await supabaseFetch(
      `/rest/v1/doadores?cpf=eq.${encodeURIComponent(cpf)}&select=id_doador&limit=1`,
      { method: 'GET' }
    );
    if (cpfCheck.ok) {
      const existing: { id_doador: string }[] = await cpfCheck.json();
      if (existing.length > 0) {
        return res.status(400).json({ detail: 'CPF já cadastrado' });
      }
    }

    const id_doador = randomUUID();
    const now = new Date().toISOString();

    const payload = {
      id_doador,
      nome_completo: nome,
      cpf,
      tipo_sanguineo,
      idade,
      sexo,
      email: body.email ?? null,
      telefone: body.telefone ?? null,
      endereco: body.endereco ?? null,
      criado_em: now,
      atualizado_em: now,
    };

    const serviceResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/doadores`, {
      method: 'POST',
      headers: getServiceHeaders(),
      body: JSON.stringify(payload),
    });

    if (!serviceResponse.ok) {
      const errText = await serviceResponse.text();
      return res.status(502).json({ detail: `Erro ao criar doador: ${errText}` });
    }

    const created: Doador[] = await serviceResponse.json();
    return res.status(201).json(created[0] ?? { id_doador });
  }

  return res.status(405).json({ detail: 'Método não permitido' });
}
