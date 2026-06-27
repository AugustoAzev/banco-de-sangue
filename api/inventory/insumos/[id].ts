import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, badRequest, notFound } from '../../_lib/supabase';
import { requireAuth } from '../../_middleware/auth';
import type { Insumo } from '../../_lib/types';

type Params = { params: Promise<{ id: string }> };

// PUT /api/inventory/insumos/[id] — update insumo nome and/or quantidade
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { id } = await params;

  let body: Partial<{ nome: string; quantidade: number }>;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body inválido');
  }

  if (!body || Object.keys(body).length === 0) {
    return badRequest('Nenhum campo para atualizar');
  }

  if (body.nome !== undefined && !body.nome) {
    return badRequest('nome não pode ser vazio');
  }
  if (body.quantidade !== undefined && body.quantidade < 0) {
    return badRequest('quantidade não pode ser negativa');
  }

  // Check insumo exists
  const check = await supabaseFetch(
    `/rest/v1/insumos?id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
    { method: 'GET' }
  );
  if (!check.ok) {
    return NextResponse.json({ detail: 'Erro ao verificar insumo' }, { status: 502 });
  }
  const found: { id: number }[] = await check.json();
  if (found.length === 0) {
    return notFound('Insumo não encontrado');
  }

  const payload: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if (body.nome !== undefined) payload.nome = body.nome;
  if (body.quantidade !== undefined) payload.quantidade = body.quantidade;

  const serviceRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/insumos?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!serviceRes.ok) {
    const errText = await serviceRes.text();
    return NextResponse.json({ detail: `Erro ao atualizar insumo: ${errText}` }, { status: 502 });
  }

  const updated: Insumo[] = await serviceRes.json();
  return NextResponse.json(updated[0] ?? {});
}

// DELETE /api/inventory/insumos/[id] — remove insumo by id
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { id } = await params;

  // Check insumo exists
  const check = await supabaseFetch(
    `/rest/v1/insumos?id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
    { method: 'GET' }
  );
  if (!check.ok) {
    return NextResponse.json({ detail: 'Erro ao verificar insumo' }, { status: 502 });
  }
  const found: { id: number }[] = await check.json();
  if (found.length === 0) {
    return notFound('Insumo não encontrado');
  }

  const serviceRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/insumos?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!serviceRes.ok) {
    const errText = await serviceRes.text();
    return NextResponse.json({ detail: `Erro ao excluir insumo: ${errText}` }, { status: 502 });
  }

  return new NextResponse(null, { status: 204 });
}
