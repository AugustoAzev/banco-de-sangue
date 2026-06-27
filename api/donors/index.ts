import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, badRequest, getServiceHeaders } from '../_lib/supabase';
import { requireAuth } from '../_middleware/auth';
import { randomUUID } from 'crypto';
import type { DoadorCreate, Doador } from '../_lib/types';

// GET /api/donors — list all donors, optional query filter
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') ?? '';

  let path = '/rest/v1/doadores?select=*&order=nome_completo.asc';

  if (query) {
    const encoded = encodeURIComponent(query);
    path += `&or=(nome_completo.ilike.*${encoded}*,cpf.ilike.*${encoded}*)`;
  }

  const response = await supabaseFetch(path, { method: 'GET' });

  if (!response.ok) {
    return NextResponse.json({ detail: 'Erro ao buscar doadores' }, { status: 502 });
  }

  const donors: Doador[] = await response.json();
  return NextResponse.json(donors);
}

// POST /api/donors — create donor with triagem validation + CPF duplicate check
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  let body: DoadorCreate;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body inválido');
  }

  const { nome, cpf, tipo_sanguineo, idade, sexo, condicao_1, condicao_2, condicao_3 } = body;

  // Required field validation
  if (!nome) return badRequest('nome é obrigatório');
  if (!cpf) return badRequest('cpf é obrigatório');
  if (!tipo_sanguineo) return badRequest('tipo_sanguineo é obrigatório');
  if (idade === undefined || idade === null) return badRequest('idade é obrigatória');
  if (!sexo) return badRequest('sexo é obrigatório');

  // Triagem validation — all conditions must be true
  if (!condicao_1 || !condicao_2 || !condicao_3) {
    return badRequest('Doador não atende aos critérios de triagem (todas as condições devem ser verdadeiras)');
  }

  // CPF duplicate check
  const cpfCheck = await supabaseFetch(
    `/rest/v1/doadores?cpf=eq.${encodeURIComponent(cpf)}&select=id_doador&limit=1`,
    { method: 'GET' }
  );
  if (cpfCheck.ok) {
    const existing: { id_doador: string }[] = await cpfCheck.json();
    if (existing.length > 0) {
      return badRequest('CPF já cadastrado');
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
    return NextResponse.json({ detail: `Erro ao criar doador: ${errText}` }, { status: 502 });
  }

  const created: Doador[] = await serviceResponse.json();
  return NextResponse.json(created[0] ?? { id_doador }, { status: 201 });
}
