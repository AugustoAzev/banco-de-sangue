// Shared TypeScript interfaces for the Banco de Sangue API

export interface TokenPayload {
  sub: string;    // email
  role: string;    // ADMINISTRADOR | ATENDENTE
  name: string;    // nome completo
  iat?: number;
  exp?: number;
}

export interface User {
  id_usuario: string;
  nome_completo: string;
  email: string;
  tipo: 'ADMINISTRADOR' | 'ATENDENTE';
  cargo?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  name: string;
}

export interface Doador {
  id_doador: string;
  nome_completo: string;
  cpf: string;
  tipo_sanguineo?: string;
  idade?: number;
  sexo?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface DoadorCreate {
  nome: string;
  documento?: string;
  cpf: string;
  tipo_sanguineo: string;
  idade: number;
  sexo: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  condicao_1: boolean;
  condicao_2: boolean;
  condicao_3: boolean;
}

export interface Bolsa {
  id: number;
  tipo_sangue: string;
  quantidade: number;
  created_at?: string;
}

export interface BolsaCreate {
  tipo_sangue: string;
  quantidade: number;
}

export interface Insumo {
  id: number;
  nome: string;
  quantidade: number;
  criado_em?: string;
  atualizado_em?: string;
}

export interface InsumoCreate {
  nome: string;
  quantidade: number;
}
