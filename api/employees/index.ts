import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, badRequest, getServiceHeaders } from '../_lib/supabase';
import { requireAuth } from '../_middleware/auth';
import { hashPassword } from '../_lib/auth';
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

interface FuncionarioResponse {
  id_usuario: string;
  nome_completo: string;
  email: string;
  cargo?: string;
  cpf: string;
  pis?: string;
  telefone?: string;
  tipo: string;
  criado_em: string;
}

// GET /api/employees — list all employees, optional query filter
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') ?? '';

  const fields = 'id_usuario,nome_completo,cargo,cpf,pis,telefone,email,tipo,criado_em';
  let path = `/rest/v1/usuarios?select=${fields}&order=nome_completo.asc`;

  if (query) {
    const encoded = encodeURIComponent(query);
    path += `&or=(nome_completo.ilike.*${encoded}*,cargo.ilike.*${encoded}*)`;
  }

  const response = await supabaseFetch(path, { method: 'GET' });

  if (!response.ok) {
    return NextResponse.json({ detail: 'Erro ao buscar funcionários' }, { status: 502 });
  }

  const employees: FuncionarioResponse[] = await response.json();
  return NextResponse.json(employees);
}

// POST /api/employees — create new atendente with hashed password
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  let body: FuncionarioCreate;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body inválido');
  }

  const { name, email, password, cpf, pis, cargo, telefone } = body;

  if (!name) return badRequest('name é obrigatório');
  if (!email) return badRequest('email é obrigatório');
  if (!password) return badRequest('password é obrigatório');

  // CPF duplicate check
  if (cpf) {
    const cpfCheck = await supabaseFetch(
      `/rest/v1/usuarios?cpf=eq.${encodeURIComponent(cpf)}&select=id_usuario&limit=1`,
      { method: 'GET' }
    );
    if (cpfCheck.ok) {
      const existing: { id_usuario: string }[] = await cpfCheck.json();
      if (existing.length > 0) {
        return badRequest('CPF já cadastrado');
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
    return NextResponse.json({ detail: `Erro ao criar funcionário: ${errText}` }, { status: 502 });
  }

  const created: FuncionarioResponse[] = await serviceResponse.json();
  return NextResponse.json(created[0] ?? { id_usuario }, { status: 201 });
}
