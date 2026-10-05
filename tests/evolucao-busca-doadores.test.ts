/**
 * TP4 — Funcionalidade 2: busca de doadores por nome, CPF, tipo sanguíneo e situação.
 */
import { filterDonors, matchesDonor, normalizeText, isSearchActive, EMPTY_DONOR_SEARCH } from '../src/lib/donor-search';

const doadores = [
  { nome_completo: 'João Carlos Pereira', cpf: '555.666.888-99', tipo_sanguineo: 'O_NEGATIVO', anonimizado_em: null },
  { nome_completo: 'Maria Oliveira Santos', cpf: '11144477735', tipo_sanguineo: 'A_POSITIVO', anonimizado_em: null },
  { nome_completo: 'Doador Anonimizado (LGPD)', cpf: null, tipo_sanguineo: 'B_POSITIVO', anonimizado_em: '2026-09-21T10:00:00Z' },
];

const busca = (override: Partial<typeof EMPTY_DONOR_SEARCH>) => ({ ...EMPTY_DONOR_SEARCH, ...override });

describe('filterDonors', () => {
  it('sem critérios devolve todos', () => {
    expect(filterDonors(doadores, EMPTY_DONOR_SEARCH)).toHaveLength(3);
  });

  it('encontra pelo nome sem diferenciar acentos nem maiúsculas', () => {
    expect(filterDonors(doadores, busca({ texto: 'joao' })).map(d => d.nome_completo)).toEqual(['João Carlos Pereira']);
    expect(filterDonors(doadores, busca({ texto: 'OLIVEIRA' }))).toHaveLength(1);
  });

  it('encontra pelo CPF com ou sem máscara, nos dois lados', () => {
    expect(filterDonors(doadores, busca({ texto: '555666' }))).toHaveLength(1);
    expect(filterDonors(doadores, busca({ texto: '111.444' }))).toHaveLength(1);
  });

  it('não casa CPF com menos de 3 dígitos (evita resultados aleatórios)', () => {
    expect(filterDonors(doadores, busca({ texto: '55' }))).toHaveLength(0);
  });

  it('não quebra com doador anonimizado (CPF nulo)', () => {
    expect(() => filterDonors(doadores, busca({ texto: '123' }))).not.toThrow();
  });

  it('filtra por tipo sanguíneo e por situação, combinados com o texto', () => {
    expect(filterDonors(doadores, busca({ tipo: 'A_POSITIVO' }))).toHaveLength(1);
    expect(filterDonors(doadores, busca({ status: 'ANONIMIZADOS' }))).toHaveLength(1);
    expect(filterDonors(doadores, busca({ status: 'ATIVOS' }))).toHaveLength(2);
    expect(filterDonors(doadores, busca({ texto: 'maria', tipo: 'O_NEGATIVO' }))).toHaveLength(0);
  });
});

describe('auxiliares', () => {
  it('normalizeText remove acentos e espaços nas pontas', () => {
    expect(normalizeText('  Ângela Conceição ')).toBe('angela conceicao');
  });

  it('isSearchActive indica se há algum critério aplicado', () => {
    expect(isSearchActive(EMPTY_DONOR_SEARCH)).toBe(false);
    expect(isSearchActive(busca({ texto: ' ' }))).toBe(false);
    expect(isSearchActive(busca({ status: 'ATIVOS' }))).toBe(true);
  });

  it('matchesDonor aceita espaço extra na busca', () => {
    expect(matchesDonor(doadores[1], busca({ texto: '  maria ' }))).toBe(true);
  });
});
