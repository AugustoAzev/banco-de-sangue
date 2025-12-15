import axios from 'axios';

const api = axios.create({
  // A URL base é relativa. O Vite (em dev) ou o Nginx/Python (em prod)
  // redirecionarão '/api' para o endereço correto do backend.
  baseURL: '/api', 
});

export default api;