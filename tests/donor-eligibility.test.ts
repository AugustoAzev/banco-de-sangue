import {
  DONOR_ELIGIBILITY,
  DONOR_SCREENING_CRITERIA,
  donorAgeValidationMessage,
  isDonorAgeEligible,
} from '../src/lib/donor-eligibility';

describe('política central de elegibilidade de doadores', () => {
  it('preserva os limites de idade atualmente vigentes', () => {
    expect(DONOR_ELIGIBILITY.minimumAge).toBe(16);
    expect(DONOR_ELIGIBILITY.maximumAge).toBe(69);
  });

  it.each([16, 30, 69])('aceita a idade elegível %i', (age) => {
    expect(isDonorAgeEligible(age)).toBe(true);
  });

  it.each([15, 70, -1, 16.5, '30', null, undefined])('rejeita idade inelegível %p', (age) => {
    expect(isDonorAgeEligible(age)).toBe(false);
  });

  it('centraliza o prazo de vacina e os textos de triagem', () => {
    expect(DONOR_ELIGIBILITY.fluVaccineWaitHours).toBe(48);
    expect(DONOR_SCREENING_CRITERIA.map((criterion) => criterion.label)).toEqual([
      'Doador tem entre 16 e 69 anos',
      'Doador pesa mais de 50kg',
      'Não tomou vacina contra gripe nas últimas 48h',
    ]);
  });

  it('expõe uma mensagem de validação consistente com a política', () => {
    expect(donorAgeValidationMessage).toBe('idade deve ser um número inteiro entre 16 e 69 anos');
  });
});
