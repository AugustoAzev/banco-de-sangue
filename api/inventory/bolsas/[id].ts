import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, notFound } from '../../_lib/supabase';
import { requireAuth } from '../../_middleware/auth';

// DELETE /api/inventory/bolsas/[id] — remove a bolsa (doacao) by id_doacao
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { id } = await params;

  // Verify bolsa exists and is in stock
  const check = await supabaseFetch(
    `/rest/v1/doacoes?id_doacao=eq.${encodeURIComponent(id)}&status=eq.EM_ESTOQUE&select=id_doacao&limit=1`,
    { method: 'GET' }
  );
  if (!check.ok) {
    return NextResponse.json({ detail: 'Erro ao verificar bolsa' }, { status: 502 });
  }
  const found: { id_doacao: string }[] = await check.json();
  if (found.length === 0) {
    return notFound('Bolsa não encontrada ou não está em estoque');
  }

  const serviceRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/doacoes?id_doacao=eq.${encodeURIComponent(id)}`,
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
    return NextResponse.json({ detail: `Erro ao remover bolsa: ${errText}` }, { status: 502 });
  }

  return new NextResponse(null, { status: 204 });
}
