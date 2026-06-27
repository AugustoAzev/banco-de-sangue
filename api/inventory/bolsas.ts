import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, badRequest, getServiceHeaders } from '../_lib/supabase';
import { requireAuth } from '../_middleware/auth';
import { randomUUID } from 'crypto';
import type { Bolsa, BolsaCreate } from '../_lib/types';

// GET /api/inventory/bolsas — list blood bags in stock, grouped by blood type
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);
  const tipoSangue = searchParams.get('tipo_sangue');

  let path = '/rest/v1/doacoes?status=eq.EM_ESTOQUE&select=id_doacao,tipo_sanguineo_coletado,data_doacao&order=data_doacao.desc';
  if (tipoSangue) {
    path += `&tipo_sanguineo_coletado=eq.${encodeURIComponent(tipoSangue)}`;
  }

  const response = await supabaseFetch(path, { method: 'GET' });
  if (!response.ok) {
    return NextResponse.json({ detail: 'Erro ao buscar bolsas em estoque' }, { status: 502 });
  }

  const rows: { id_doacao: string; tipo_sanguineo_coletado: string; data_doacao: string }[] = await response.json();

  // Group by blood type — PostgREST has no aggregation, so group client-side
  const grouped: Record<string, { id: string; tipo_sangue: string; created_at: string }[]> = {};
  for (const row of rows) {
    if (!grouped[row.tipo_sanguineo_coletado]) {
      grouped[row.tipo_sanguineo_coletado] = [];
    }
    grouped[row.tipo_sanguineo_coletado].push({
      id: row.id_doacao,
      tipo_sangue: row.tipo_sanguineo_coletado,
      created_at: row.data_doacao,
    });
  }

  const result: Bolsa[] = Object.entries(grouped).map(([tipo_sangue, bolsas]) => ({
    id: 0, // placeholder; quantity is the key metric
    tipo_sangue,
    quantidade: bolsas.length,
    created_at: bolsas[0]?.created_at,
  }));

  return NextResponse.json(result);
}

// POST /api/inventory/bolsas — register manual stock entry (N bolsa records as doacoes rows)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.error;

  let body: BolsaCreate;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body inválido');
  }

  const { tipo_sangue, quantidade } = body;
  if (!tipo_sangue) return badRequest('tipo_sangue é obrigatório');
  if (!quantidade || quantidade < 1) return badRequest('quantidade deve ser >= 1');

  // Resolve generic donor (cpf = 000.000.000-00)
  const donorRes = await supabaseFetch(
    `/rest/v1/doadores?cpf=eq.000.000.000-00&select=id_doador&limit=1`,
    { method: 'GET' }
  );
  if (!donorRes.ok) {
    return NextResponse.json({ detail: 'Erro ao buscar doador genérico' }, { status: 502 });
  }
  const donors: { id_doador: string }[] = await donorRes.json();
  if (donors.length === 0) {
    return badRequest('Doador genérico (cpf=000.000.000-00) não encontrado');
  }
  const id_doador = donors[0].id_doador;

  // Resolve first unidade_coleta
  const ucRes = await supabaseFetch(
    `/rest/v1/unidades_coleta?select=id_unidade&order=id_unidade.asc&limit=1`,
    { method: 'GET' }
  );
  if (!ucRes.ok) {
    return NextResponse.json({ detail: 'Erro ao buscar unidade de coleta' }, { status: 502 });
  }
  const ucs: { id_unidade: string }[] = await ucRes.json();
  if (ucs.length === 0) {
    return badRequest('Nenhuma unidade de coleta cadastrada');
  }
  const id_unidade = ucs[0].id_unidade;

  const userId = auth.user.sub;
  const now = new Date().toISOString();

  // Build N doacoes rows
  const bolsaPayloads = Array.from({ length: quantidade }, () => ({
    id_doacao: randomUUID(),
    id_doador,
    id_unidade_coleta: id_unidade,
    tipo_sanguineo_coletado: tipo_sangue,
    volume_ml: 450,
    status: 'EM_ESTOQUE',
    data_doacao: now,
    id_atendente: userId,
    criado_em: now,
    atualizado_em: now,
  }));

  const serviceRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/doacoes`, {
    method: 'POST',
    headers: getServiceHeaders(),
    body: JSON.stringify(bolsaPayloads),
  });

  if (!serviceRes.ok) {
    const errText = await serviceRes.text();
    return NextResponse.json({ detail: `Erro ao registrar bolsas: ${errText}` }, { status: 502 });
  }

  const created = await serviceRes.json();
  return NextResponse.json({ registradas: created.length, bolsas: created }, { status: 201 });
}
