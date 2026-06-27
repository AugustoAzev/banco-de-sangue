import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../_lib/auth';

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function requireAuth(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { authorized: false, error: NextResponse.json({ detail: 'Não autenticado' }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { authorized: false, error: NextResponse.json({ detail: 'Token inválido ou expirado' }, { status: 401 }) };
  }

  return { authorized: true, user: payload };
}
