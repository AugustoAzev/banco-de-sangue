import { NextApiRequest } from 'next';
import { verifyToken } from './auth';

interface AuthResult {
  authorized: boolean;
  user?: {
    sub: string;
    role: string;
    name: string;
  };
  error?: { status: number; data: { detail: string } };
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function requireAuth(req: NextApiRequest): Promise<AuthResult> {
  const token = getTokenFromRequest(req);
  if (!token) {
    return { authorized: false, error: { status: 401, data: { detail: 'Não autenticado' } } };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { authorized: false, error: { status: 401, data: { detail: 'Token inválido ou expirado' } } };
  }

  return { authorized: true, user: payload };
}
