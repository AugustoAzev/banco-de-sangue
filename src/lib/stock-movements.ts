import { BLOOD_TYPES } from './blood-types';

/**
 * Saída de bolsas do estoque (TP4 — Funcionalidade 1).
 *
 * O banco já previa os status DESPACHADA e DESCARTADA, mas nenhuma tela os usava:
 * a única forma de tirar uma bolsa do estoque era excluí-la, apagando o registro.
 * Uma saída muda o status e preserva o histórico (rastreabilidade exigida pela ANVISA).
 */
export const STOCK_EXIT_STATUSES = ['DESPACHADA', 'DESCARTADA'] as const;
export type StockExitStatus = (typeof STOCK_EXIT_STATUSES)[number];

export const STOCK_EXIT_LABELS: Record<StockExitStatus, string> = {
  DESPACHADA: 'Despacho',
  DESCARTADA: 'Descarte',
};

export const STOCK_EXIT_NOTE_MAX_LENGTH = 300;

export interface StockExitRequest {
  tipo_sangue: string;
  quantidade: number;
  status: StockExitStatus;
  observacoes: string | null;
}

/** Valida o corpo de `POST /inventory/saidas`. Retorna a mensagem de erro ou os dados normalizados. */
export function parseStockExit(body: unknown): { error: string } | { data: StockExitRequest } {
  const b = (body ?? {}) as Record<string, unknown>;

  if (typeof b.tipo_sangue !== 'string' || !(BLOOD_TYPES as readonly string[]).includes(b.tipo_sangue)) {
    return { error: 'tipo_sangue inválido' };
  }
  if (typeof b.quantidade !== 'number' || !Number.isInteger(b.quantidade) || b.quantidade < 1) {
    return { error: 'quantidade deve ser um número inteiro maior ou igual a 1' };
  }
  if (typeof b.status !== 'string' || !(STOCK_EXIT_STATUSES as readonly string[]).includes(b.status)) {
    return { error: 'status deve ser DESPACHADA ou DESCARTADA' };
  }

  const observacoes = typeof b.observacoes === 'string' ? b.observacoes.trim() : '';
  if (b.status === 'DESCARTADA' && !observacoes) {
    return { error: 'Informe o motivo do descarte' };
  }
  if (observacoes.length > STOCK_EXIT_NOTE_MAX_LENGTH) {
    return { error: `observacoes deve ter no máximo ${STOCK_EXIT_NOTE_MAX_LENGTH} caracteres` };
  }

  return {
    data: {
      tipo_sangue: b.tipo_sangue,
      quantidade: b.quantidade,
      status: b.status as StockExitStatus,
      observacoes: observacoes || null,
    },
  };
}

export type MovementKind = 'ENTRADA' | StockExitStatus;

export interface DonationRow {
  tipo_sanguineo_coletado: string;
  status: string;
  data_doacao: string;
  atualizado_em: string;
  observacoes?: string | null;
}

export interface StockMovement {
  tipo: MovementKind;
  tipo_sangue: string;
  quantidade: number;
  data: string;
  observacoes: string | null;
}

/**
 * Reconstrói as movimentações a partir das bolsas.
 *
 * - Toda bolsa gera uma ENTRADA na `data_doacao`.
 * - Bolsas que saíram geram também um DESPACHO/DESCARTE em `atualizado_em`.
 *
 * Uma entrada de N bolsas é gravada num único INSERT (mesma data) e uma saída num
 * único UPDATE (mesmo `atualizado_em`), então agrupar por tipo + data + status
 * recupera cada operação com a sua quantidade.
 */
export function buildMovements(rows: DonationRow[], limit = 8): StockMovement[] {
  const groups = new Map<string, StockMovement>();

  const add = (tipo: MovementKind, row: DonationRow, data: string, observacoes: string | null) => {
    const key = `${tipo}|${row.tipo_sanguineo_coletado}|${data}|${observacoes ?? ''}`;
    const existing = groups.get(key);
    if (existing) existing.quantidade += 1;
    else groups.set(key, { tipo, tipo_sangue: row.tipo_sanguineo_coletado, quantidade: 1, data, observacoes });
  };

  for (const row of rows) {
    add('ENTRADA', row, row.data_doacao, null);
    if ((STOCK_EXIT_STATUSES as readonly string[]).includes(row.status)) {
      add(row.status as StockExitStatus, row, row.atualizado_em, row.observacoes ?? null);
    }
  }

  return [...groups.values()]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, limit);
}
