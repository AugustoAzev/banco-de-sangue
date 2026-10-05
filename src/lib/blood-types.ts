/**
 * Tipos sanguíneos aceitos pelo banco (enum `tiposanguineo`) e a forma como
 * aparecem para o usuário. Antes cada tela tinha sua própria conversão, com
 * resultados diferentes ("A+" no estoque, "A +" no cadastro de doador).
 */
export const BLOOD_TYPES = [
  'A_POSITIVO', 'A_NEGATIVO',
  'B_POSITIVO', 'B_NEGATIVO',
  'AB_POSITIVO', 'AB_NEGATIVO',
  'O_POSITIVO', 'O_NEGATIVO',
] as const;

export type BloodType = (typeof BLOOD_TYPES)[number];

export function formatBloodType(tipo: string | null | undefined): string {
  if (!tipo) return '—';
  const [grupo, rh] = tipo.split('_');
  if (!grupo || (rh !== 'POSITIVO' && rh !== 'NEGATIVO')) return tipo;
  return `${grupo}${rh === 'POSITIVO' ? '+' : '-'}`;
}

/** Nome por extenso, usado por leitores de tela ("A negativo" em vez de "A traço"). */
export function speakBloodType(tipo: string | null | undefined): string {
  if (!tipo) return 'tipo não informado';
  const [grupo, rh] = tipo.split('_');
  if (!grupo || (rh !== 'POSITIVO' && rh !== 'NEGATIVO')) return tipo;
  return `${grupo} ${rh === 'POSITIVO' ? 'positivo' : 'negativo'}`;
}
