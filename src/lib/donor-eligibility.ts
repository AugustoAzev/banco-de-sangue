/**
 * Política de elegibilidade de doadores.
 *
 * Este é o ponto único de manutenção para regras compartilhadas pela API,
 * interface e testes. Alterações regulatórias futuras devem ser feitas aqui.
 */
export const DONOR_ELIGIBILITY = {
  minimumAge: 16,
  maximumAge: 69,
  fluVaccineWaitHours: 48,
} as const;

export const DONOR_SCREENING_CRITERIA = [
  {
    name: 'condicao_1',
    label: `Doador tem entre ${DONOR_ELIGIBILITY.minimumAge} e ${DONOR_ELIGIBILITY.maximumAge} anos`,
  },
  {
    name: 'condicao_2',
    label: 'Doador pesa mais de 50kg',
  },
  {
    name: 'condicao_3',
    label: `Não tomou vacina contra gripe nas últimas ${DONOR_ELIGIBILITY.fluVaccineWaitHours}h`,
  },
] as const;

export const donorAgeValidationMessage =
  `idade deve ser um número inteiro entre ${DONOR_ELIGIBILITY.minimumAge} e ${DONOR_ELIGIBILITY.maximumAge} anos`;

export function isDonorAgeEligible(age: unknown): age is number {
  return typeof age === 'number'
    && Number.isInteger(age)
    && age >= DONOR_ELIGIBILITY.minimumAge
    && age <= DONOR_ELIGIBILITY.maximumAge;
}
