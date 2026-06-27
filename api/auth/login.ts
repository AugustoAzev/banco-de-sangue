import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, badRequest, unauthorized } from '../_lib/supabase';
import { signToken, verifyPassword } from '../_lib/auth';
import type { LoginRequest } from '../_lib/types';

export async function POST(request: NextRequest) {
  let body: LoginRequest;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body inválido');
  }

  const { email, password } = body;
  if (!email || !password) {
    return badRequest('email e password são obrigatórios');
  }

  // Query user by email via PostgREST
  const response = await supabaseFetch(
    `/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&select=*&limit=1`,
    { method: 'GET' }
  );

  if (!response.ok) {
    return unauthorized();
  }

  const users = await response.json();
  if (!Array.isArray(users) || users.length === 0) {
    return unauthorized();
  }

  const user = users[0];

  const passwordValid = await verifyPassword(password, user.senha_hash);
  if (!passwordValid) {
    return unauthorized();
  }

  const token = signToken({
    sub: user.email,
    role: user.tipo,
    name: user.nome_completo,
  });

  return NextResponse.json({
    access_token: token,
    token_type: 'bearer',
    role: user.tipo,
    name: user.nome_completo,
  });
}