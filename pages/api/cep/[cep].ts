import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../src/lib/auth-helpers';

export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean | string;
}

const VIACEP_BASE_URL = 'https://viacep.com.br/ws';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return res.status(auth.error!.status).json(auth.error!.data);

  if (req.method !== 'GET') {
    return res.status(405).json({ detail: 'Método não permitido' });
  }

  const rawCep = (req.query.cep as string) ?? '';
  const cep = rawCep.replace(/\D/g, '');

  if (cep.length !== 8) {
    return res.status(400).json({ detail: 'CEP deve conter 8 dígitos' });
  }

  let viaCepRes: Response;
  try {
    viaCepRes = await fetch(`${VIACEP_BASE_URL}/${cep}/json/`);
  } catch {
    return res.status(502).json({ detail: 'Não foi possível consultar o serviço de CEP' });
  }

  if (!viaCepRes.ok) {
    return res.status(502).json({ detail: 'Não foi possível consultar o serviço de CEP' });
  }

  const data: ViaCepResponse = await viaCepRes.json();

  if (data.erro) {
    return res.status(404).json({ detail: 'CEP não encontrado' });
  }

  const endereco: EnderecoViaCep = {
    cep: data.cep,
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    uf: data.uf,
  };

  return res.status(200).json(endereco);
}
