import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, badRequest } from '../_lib/supabase';
import { requireAuth } from '../_middleware/auth';
import type { Insumo, InsumoCreate } from '../_lib/types';

// GET /api/inventory/insumos — list all insumos ordered by id asc
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const response = await supabaseFetch(
    '/rest/v1/insumos?select=*&order=id.asc',
    { method: 'GET' }
  );

  if (!response.ok) {
    return NextResponse.json({ detail: 'Erro ao buscar insumos' }, { status: 502 });
  }

  const insumos: Insumo[] = await response.json();
  return NextResponse.json(insumos);
}

// POST /api/inventory/insumos — create insumo
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  let body: InsumoCreate;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body inválido');
  }

  const { nome, quantidade } = body;
  if (!nome) return badRequest('nome é obrigatório');
  if (quantidade === undefined || quantidade === null) return badRequest('quantidade é obrigatória');
  if (quantidade < 0) return badRequest('quantidade não pode ser negativa');

  const now = new Date().toISOString();
  const payload = {
    nome,
    quantidade,
    criado_em: now,
    atualizado_em: now,
  };

  const serviceRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/insumos`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!serviceRes.ok) {
    const errText = await serviceRes.text();
    return NextResponse.json({ detail: `Erro ao criar insumo: ${errText}` }, { status: 502 });
  }

  const created: Insumo[] = await serviceRes.json();
  return NextResponse.json(created[0] ?? payload, { status: 201 });
}
