/**
 * Registros internos que o sistema depende para funcionar.
 *
 * O doador genérico recebe as entradas manuais de estoque
 * (`POST /inventory/bolsas`). Se ele for editado, anonimizado (CPF removido)
 * ou excluído, o registro de novas bolsas deixa de funcionar.
 */
export const GENERIC_DONOR_CPF = '000.000.000-00';

export const GENERIC_DONOR_PROTECTED_MESSAGE =
  'Este é um registro interno do sistema (entradas manuais de estoque) e não pode ser alterado';

export function isGenericDonor(doador: { cpf?: string | null }): boolean {
  return !!doador.cpf && doador.cpf.replace(/\D/g, '') === GENERIC_DONOR_CPF.replace(/\D/g, '');
}
