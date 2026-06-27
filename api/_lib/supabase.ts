import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function getSupabaseHeaders(supabaseToken?: string) {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': supabaseToken ? `Bearer ${supabaseToken}` : `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

export function getServiceHeaders() {
  return {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

export async function supabaseFetch(
  path: string,
  options: RequestInit = {},
  serviceRole = false
) {
  const url = `${SUPABASE_URL}${path}`;
  const headers = serviceRole ? getServiceHeaders() : getSupabaseHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  return response;
}

export function unauthorized(message = 'Credenciais inválidas') {
  return NextResponse.json({ detail: message }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ detail: message }, { status: 400 });
}

export function notFound(message: string) {
  return NextResponse.json({ detail: message }, { status: 404 });
}

export function internalError(message: string) {
  return NextResponse.json({ detail: message }, { status: 500 });
}
