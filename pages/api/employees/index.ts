import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, getServiceHeaders } from '../../src/lib/supabase';
import { requireAuth } from '../../src/lib/auth-helpers';
import { hashPassword } from '../../src/lib/auth';
import { randomUUID } from 'crypto';

interface FuncionarioCreate {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  pis?: string;
  cargo?: string;
  telefone?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  if (req.method === 'GET') {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const query = searchParams.get('query') ?? '';

    const fields = 'id_usuario,nome_completo,cargo,cpf,pis,telefone,email,tipo,criado_em';
    let path = `/rest/v1/usuarios?select=${fields}&order=nome_completo.asc`;

    if (query) {
      const encoded = encodeURIComponent(query);
      path += `&or=(nome_completo.ilike.*${encoded}*,cargo.ilike.*${encoded}*)`;
    }

    const response = await supabaseFetch(path, { method: 'GET' });

    if (!response.ok) {
      return res.status(502).json({ detail: 'Erro ao buscar funcionários' });
    }

    const employees = await response.json();
    return res.status(200).json(employees);
  }

  if (req.method === 'POST') {
    const body = req.body as FuncionarioCreate;
    const { name, email, password, cpf, pis, cargo, telefone } = body;

    if (!name) return res.status(400).json({ detail: 'name é obrigatório' });
    if (!email) return res.status(400).json({ detail: 'email é obrigatório' });
    if (!password) return res.status(400).json({ detail: 'password é obrigatório' });

    if (cpf) {
      const cpfCheck = await supabaseFetch(
        `/rest/v1/usuarios?cpf=eq.${encodeURIComponent(cpf)}&select=id_usuario&limit=1`,
        { method: 'GET' }
      );
      if (cpfCheck.ok) {
        const existing: { id_usuario: string }[] = await cpfCheck.json();
        if (existing.length > 0) {
          return res.status(400).json({ detail: 'CPF já cadastrado' });
        }
      }
    }

    const id_usuario = randomUUID();
    const senha_hash = await hashPassword(password);
    const now = new Date().toISOString();

    const payload = {
      id_usuario,
      nome_completo: name,
      email,
      senha_hash,
      cpf: cpf ?? null,
      pis: pis ?? null,
      cargo: cargo ?? null,
      telefone: telefone ?? null,
      tipo: 'ATENDENTE',
      criado_em: now,
    };

    const serviceResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/usuarios`, {
      method: 'POST',
      headers: getServiceHeaders(),
      body: JSON.stringify(payload),
    });

    if (!serviceResponse.ok) {
      const errText = await serviceResponse.text();
      return res.status(502).json({ detail: `Erro ao criar funcionário: ${errText}` });
    }

    const created = await serviceResponse.json();
    return res.status(201).json(created[0] ?? { id_usuario });
  }

  return res.status(405).json({ detail: 'Método não permitido' });
}
