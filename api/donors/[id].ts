import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, badRequest, notFound, getServiceHeaders } from '../_lib/supabase';
import { requireAuth } from '../_middleware/auth';
import type { Doador } from '../_lib/types';

type Params = { params: Promise<{ id: string }> };

// PUT /api/donors/[id] — update donor fields
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { id } = await params;

  let body: Partial<{
    nome: string;
    tipo_sanguineo: string;
    idade: number;
    sexo: string;
    email: string;
    telefone: string;
    endereco: string;
  }>;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body inválido');
  }

  if (!body || Object.keys(body).length === 0) {
    return badRequest('Nenhum campo para atualizar');
  }

  // Check donor exists
  const check = await supabaseFetch(
    `/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}&select=id_doador&limit=1`,
    { method: 'GET' }
  );
  if (!check.ok) {
    return NextResponse.json({ detail: 'Erro ao verificar doador' }, { status: 502 });
  }
  const found: Doador[] = await check.json();
  if (found.length === 0) {
    return notFound('Doador não encontrado');
  }

  // Build PATCH payload
  const payload: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if (body.nome !== undefined) payload.nome_completo = body.nome;
  if (body.tipo_sanguineo !== undefined) payload.tipo_sanguineo = body.tipo_sanguineo;
  if (body.idade !== undefined) payload.idade = body.idade;
  if (body.sexo !== undefined) payload.sexo = body.sexo;
  if (body.email !== undefined) payload.email = body.email;
  if (body.telefone !== undefined) payload.telefone = body.telefone;
  if (body.endereco !== undefined) payload.endereco = body.endereco;

  const serviceResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getServiceHeaders(),
    body: JSON.stringify(payload),
  });

  if (!serviceResponse.ok) {
    const errText = await serviceResponse.text();
    return NextResponse.json({ detail: `Erro ao atualizar doador: ${errText}` }, { status: 502 });
  }

  const updated: Doador[] = await serviceResponse.json();
  return NextResponse.json(updated[0] ?? {});
}

// DELETE /api/donors/[id] — delete donor, check for linked donations first
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { id } = await params;

  // Check donor exists
  const check = await supabaseFetch(
    `/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}&select=id_doador&limit=1`,
    { method: 'GET' }
  );
  if (!check.ok) {
    return NextResponse.json({ detail: 'Erro ao verificar doador' }, { status: 502 });
  }
  const found: Doador[] = await check.json();
  if (found.length === 0) {
    return notFound('Doador não encontrado');
  }

  // Check for linked donations
  const donationCheck = await supabaseFetch(
    `/rest/v1/doacoes?id_doador=eq.${encodeURIComponent(id)}&select=id_doacao&limit=1`,
    { method: 'GET' }
  );
  if (donationCheck.ok) {
    const donations: { id_doacao: string }[] = await donationCheck.json();
    if (donations.length > 0) {
      return badRequest('Doador possui doações associadas e não pode ser excluído');
    }
  }

  const serviceResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/doadores?id_doador=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getServiceHeaders(),
  });

  if (!serviceResponse.ok) {
    const errText = await serviceResponse.text();
    return NextResponse.json({ detail: `Erro ao excluir doador: ${errText}` }, { status: 502 });
  }

  return new NextResponse(null, { status: 204 });
}
