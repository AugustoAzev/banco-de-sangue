/**
 * Busca de doadores (TP4 — Funcionalidade 2).
 *
 * A lista de doadores já chega inteira do `GET /donors`, então a busca é feita
 * na própria tela, sem nova consulta ao banco a cada tecla.
 */
export interface DonorSearchable {
  nome_completo: string;
  cpf: string | null;
  tipo_sanguineo?: string | null;
  anonimizado_em?: string | null;
}

export type DonorStatusFilter = 'TODOS' | 'ATIVOS' | 'ANONIMIZADOS';

export interface DonorSearchCriteria {
  texto: string;
  tipo: string;
  status: DonorStatusFilter;
}

export const EMPTY_DONOR_SEARCH: DonorSearchCriteria = { texto: '', tipo: '', status: 'TODOS' };

/** Minúsculas e sem acentos: "João" encontra "joao" e vice-versa. */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function matchesDonor(doador: DonorSearchable, criteria: DonorSearchCriteria): boolean {
  if (criteria.tipo && doador.tipo_sanguineo !== criteria.tipo) return false;

  const anonimizado = !!doador.anonimizado_em;
  if (criteria.status === 'ATIVOS' && anonimizado) return false;
  if (criteria.status === 'ANONIMIZADOS' && !anonimizado) return false;

  const texto = normalizeText(criteria.texto);
  if (!texto) return true;

  if (normalizeText(doador.nome_completo).includes(texto)) return true;

  // CPF: compara só os dígitos, com ou sem máscara dos dois lados.
  const digitosBusca = texto.replace(/\D/g, '');
  if (digitosBusca.length >= 3 && doador.cpf) {
    return doador.cpf.replace(/\D/g, '').includes(digitosBusca);
  }
  return false;
}

export function filterDonors<T extends DonorSearchable>(doadores: T[], criteria: DonorSearchCriteria): T[] {
  return doadores.filter(d => matchesDonor(d, criteria));
}

export function isSearchActive(criteria: DonorSearchCriteria): boolean {
  return !!criteria.texto.trim() || !!criteria.tipo || criteria.status !== 'TODOS';
}
