import { BLOOD_TYPES, type BloodType } from './blood-types';

/**
 * Política de estoque — ponto único para os limites usados pelo painel e
 * pelas telas de estoque/insumos (mesmo padrão de `donor-eligibility.ts`).
 *
 * Antes o painel afirmava que o tipo com menor estoque estava "abaixo do nível
 * de segurança" sem que existisse nenhum nível definido.
 */
export const INVENTORY_POLICY = {
  /** Bolsas por tipo sanguíneo abaixo das quais o tipo é sinalizado como crítico. */
  minimumBagsPerType: 3,
  /** Quantidade de um insumo abaixo da qual ele é sinalizado como baixo estoque. */
  lowSupplyThreshold: 10,
  /** Volume padrão registrado para cada bolsa de sangue total. */
  bagVolumeMl: 450,
} as const;

export interface StockGroup {
  tipo_sangue: string;
  quantidade: number;
}

export interface StockSummary {
  totalBags: number;
  byType: Record<BloodType, number>;
  lowest: { tipo: BloodType; quantidade: number };
  belowMinimum: { tipo: BloodType; quantidade: number }[];
}

/**
 * Consolida a resposta agrupada de `GET /inventory/bolsas` (uma linha por tipo,
 * com `quantidade`). Tipos sem nenhuma bolsa entram com zero.
 */
export function summarizeStock(groups: StockGroup[]): StockSummary {
  const byType = Object.fromEntries(BLOOD_TYPES.map(t => [t, 0])) as Record<BloodType, number>;
  for (const g of groups) {
    if (g.tipo_sangue in byType) byType[g.tipo_sangue as BloodType] += g.quantidade;
  }

  const ordered = BLOOD_TYPES.map(tipo => ({ tipo, quantidade: byType[tipo] }));
  const lowest = ordered.reduce((min, cur) => (cur.quantidade < min.quantidade ? cur : min));
  const belowMinimum = ordered
    .filter(t => t.quantidade < INVENTORY_POLICY.minimumBagsPerType)
    .sort((a, b) => a.quantidade - b.quantidade);

  return {
    totalBags: ordered.reduce((sum, t) => sum + t.quantidade, 0),
    byType,
    lowest,
    belowMinimum,
  };
}

export function isSupplyLow(quantidade: number): boolean {
  return quantidade < INVENTORY_POLICY.lowSupplyThreshold;
}
