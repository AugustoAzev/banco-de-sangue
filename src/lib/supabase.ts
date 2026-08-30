import { NextApiResponse } from 'next';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseHeaders(supabaseToken?: string): Record<string, string> {
  return {
    'apikey': SUPABASE_ANON_KEY!,
    'Authorization': supabaseToken ? `Bearer ${supabaseToken}` : `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

export function getServiceHeaders(): Record<string, string> {
  return {
    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

export function checkEnvVars() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  return missing;
}

export async function supabaseFetch(
  path: string,
  options: RequestInit = {},
  serviceRole = false
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = checkEnvVars();
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
  const url = `${SUPABASE_URL}${path}`;
  const headers = serviceRole ? getServiceHeaders() : getSupabaseHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    } as Record<string, string>,
  });

  return response;
}

export function unauthorized(res: NextApiResponse, message = 'Credenciais inválidas') {
  return res.status(401).json({ detail: message });
}

export function badRequest(res: NextApiResponse, message: string) {
  return res.status(400).json({ detail: message });
}

export function notFound(res: NextApiResponse, message: string) {
  return res.status(404).json({ detail: message });
}

export function internalError(res: NextApiResponse, message: string) {
  return res.status(500).json({ detail: message });
}

export function serverError(err: unknown, res: NextApiResponse) {
  const message = err instanceof Error ? err.message : 'Erro interno do servidor';
  console.error('[supabaseFetch error]', message);
  return res.status(500).json({ detail: message });
}
