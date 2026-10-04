/**
 * TP4 — Redesign (H1 Visibilidade do status do sistema).
 *
 * O painel contava as linhas da resposta agrupada de /inventory/bolsas
 * (uma por tipo sanguíneo) e mostrava o número de TIPOS como "Bolsas em
 * Estoque". O "Nível Crítico" também era calculado sobre essa contagem.
 */
import { summarizeStock, isSupplyLow, INVENTORY_POLICY } from '../src/lib/inventory-policy';
import { formatBloodType, speakBloodType, BLOOD_TYPES } from '../src/lib/blood-types';

// Estoque real usado nas capturas de tela "antes": 9 bolsas em 6 tipos.
const estoqueAntes = [
  { tipo_sangue: 'O_POSITIVO', quantidade: 2 },
  { tipo_sangue: 'A_POSITIVO', quantidade: 3 },
  { tipo_sangue: 'AB_POSITIVO', quantidade: 1 },
  { tipo_sangue: 'O_NEGATIVO', quantidade: 1 },
  { tipo_sangue: 'B_POSITIVO', quantidade: 1 },
  { tipo_sangue: 'A_NEGATIVO', quantidade: 1 },
];

describe('summarizeStock', () => {
  it('soma as quantidades em vez de contar os grupos', () => {
    const resumo = summarizeStock(estoqueAntes);
    expect(resumo.totalBags).toBe(9);
    expect(estoqueAntes.length).toBe(6); // o valor que o painel mostrava antes
  });

  it('considera tipos ausentes da resposta como zero', () => {
    const resumo = summarizeStock(estoqueAntes);
    expect(resumo.byType.B_NEGATIVO).toBe(0);
    expect(resumo.byType.AB_NEGATIVO).toBe(0);
    expect(Object.keys(resumo.byType)).toHaveLength(8);
  });

  it('aponta o tipo com menor quantidade real', () => {
    const resumo = summarizeStock([
      { tipo_sangue: 'A_POSITIVO', quantidade: 5 },
      { tipo_sangue: 'A_NEGATIVO', quantidade: 4 },
      { tipo_sangue: 'B_POSITIVO', quantidade: 6 },
      { tipo_sangue: 'B_NEGATIVO', quantidade: 7 },
      { tipo_sangue: 'AB_POSITIVO', quantidade: 8 },
      { tipo_sangue: 'AB_NEGATIVO', quantidade: 9 },
      { tipo_sangue: 'O_POSITIVO', quantidade: 3 },
      { tipo_sangue: 'O_NEGATIVO', quantidade: 10 },
    ]);
    expect(resumo.lowest).toEqual({ tipo: 'O_POSITIVO', quantidade: 3 });
    expect(resumo.belowMinimum).toEqual([]);
  });

  it('lista os tipos abaixo do mínimo da política, do mais crítico ao menos crítico', () => {
    const resumo = summarizeStock(estoqueAntes);
    const minimo = INVENTORY_POLICY.minimumBagsPerType;
    expect(resumo.belowMinimum.every(t => t.quantidade < minimo)).toBe(true);
    expect(resumo.belowMinimum[0].quantidade).toBe(0);
    expect(resumo.belowMinimum.map(t => t.tipo)).not.toContain('A_POSITIVO'); // 3 bolsas = no mínimo
  });

  it('ignora tipos desconhecidos sem quebrar', () => {
    const resumo = summarizeStock([{ tipo_sangue: 'XYZ', quantidade: 4 }]);
    expect(resumo.totalBags).toBe(0);
  });
});

describe('isSupplyLow', () => {
  it('usa o limite da política de estoque', () => {
    expect(isSupplyLow(INVENTORY_POLICY.lowSupplyThreshold - 1)).toBe(true);
    expect(isSupplyLow(INVENTORY_POLICY.lowSupplyThreshold)).toBe(false);
  });
});

describe('formatBloodType / speakBloodType', () => {
  it('usa o mesmo rótulo em todas as telas', () => {
    expect(formatBloodType('A_POSITIVO')).toBe('A+');
    expect(formatBloodType('AB_NEGATIVO')).toBe('AB-');
    expect(BLOOD_TYPES.map(formatBloodType)).toEqual(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
  });

  it('trata valor vazio ou desconhecido', () => {
    expect(formatBloodType('')).toBe('—');
    expect(formatBloodType(null)).toBe('—');
    expect(formatBloodType('INVALIDO')).toBe('INVALIDO');
  });

  it('gera o nome por extenso para leitores de tela', () => {
    expect(speakBloodType('O_NEGATIVO')).toBe('O negativo');
    expect(speakBloodType('AB_POSITIVO')).toBe('AB positivo');
  });
});
