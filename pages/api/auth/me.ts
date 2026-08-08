import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../src/lib/auth-helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ detail: 'Método não permitido' });
  }

  const auth = await requireAuth(req);

  if (!auth.authorized) {
    return res.status(401).json({ detail: 'Não autorizado' });
  }

  const user = auth.user!;

  return res.status(200).json({
    name: user.name,
    role: user.role,
    email: user.sub,
  });
}
