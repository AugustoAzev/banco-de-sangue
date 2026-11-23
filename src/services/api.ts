import axios from 'axios';

const api = axios.create({
  // A URL base é relativa. O Vite (em dev) ou o Nginx/Python (em prod)
  // redirecionarão '/api' para o endereço correto do backend.
  baseURL: '/api', 
});

export default api;
/**
 * Lê o campo `detail` que as rotas da API devolvem nos erros.
 * Retorna `undefined` quando o erro não veio de uma resposta HTTP (ex.: falha de rede).
 */
export function apiErrorDetail(err: unknown): unknown {
  return axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
}
