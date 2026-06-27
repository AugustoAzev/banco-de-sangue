import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, badRequest, unauthorized, serverError } from '../_lib/supabase';
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

  let response;
  try {
    response = await supabaseFetch(
      `/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&select=*&limit=1`,
      { method: 'GET' }
    );
  } catch (err) {
    return serverError(err);
  }

  if (!response.ok) {
    return NextResponse.json(
      { detail: 'Erro ao consultar banco de dados' },
      { status: 502 }
    );
  }

  let users;
  try {
    users = await response.json();
  } catch {
    return NextResponse.json(
      { detail: 'Erro ao processar resposta do banco' },
      { status: 502 }
    );
  }

  if (!Array.isArray(users) || users.length === 0) {
    return unauthorized();
  }

  const user = users[0];

  if (!user.senha_hash) {
    return NextResponse.json(
      { detail: 'Usuário sem senha configurada' },
      { status: 500 }
    );
  }

  let passwordValid;
  try {
    passwordValid = await verifyPassword(password, user.senha_hash);
  } catch (err) {
    return serverError(err);
  }

  if (!passwordValid) {
    return unauthorized();
  }

  let token;
  try {
    token = signToken({
      sub: user.email,
      role: user.tipo,
      name: user.nome_completo,
    });
  } catch (err) {
    return serverError(err);
  }

  return NextResponse.json({
    access_token: token,
    token_type: 'bearer',
    role: user.tipo,
    name: user.nome_completo,
  });
}