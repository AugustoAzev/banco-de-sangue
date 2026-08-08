import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseFetch, badRequest, unauthorized, serverError } from '../_lib/supabase';
import { signToken, verifyPassword } from '../_lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Método não permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return badRequest(res, 'email e password são obrigatórios');
  }

  let response;
  try {
    response = await supabaseFetch(
      `/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&select=*&limit=1`,
      { method: 'GET' }
    );
  } catch (err) {
    return serverError(err, res);
  }

  if (!response.ok) {
    return res.status(502).json({ detail: 'Erro ao consultar banco de dados' });
  }

  let users;
  try {
    users = await response.json();
  } catch {
    return res.status(502).json({ detail: 'Erro ao processar resposta do banco' });
  }

  if (!Array.isArray(users) || users.length === 0) {
    return unauthorized(res);
  }

  const user = users[0];

  if (!user.senha_hash) {
    return res.status(500).json({ detail: 'Usuário sem senha configurada' });
  }

  let passwordValid;
  try {
    passwordValid = await verifyPassword(password, user.senha_hash);
  } catch (err) {
    return serverError(err, res);
  }

  if (!passwordValid) {
    return unauthorized(res);
  }

  let token;
  try {
    token = signToken({
      sub: user.email,
      role: user.tipo,
      name: user.nome_completo,
    });
  } catch (err) {
    return serverError(err, res);
  }

  return res.status(200).json({
    access_token: token,
    token_type: 'bearer',
    role: user.tipo,
    name: user.nome_completo,
  });
}
