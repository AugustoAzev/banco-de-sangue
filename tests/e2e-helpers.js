// Credenciais do usuário de demonstração criado pelo seed do banco.
// No CI podem ser trocadas pelas variáveis E2E_EMAIL e E2E_PASSWORD.
export const EMAIL = process.env.E2E_EMAIL ?? 'admin@pulse.com';
export const SENHA = process.env.E2E_PASSWORD ?? '12345678';

export async function entrar(page, email = EMAIL, senha = SENHA) {
  await page.goto('/');
  await page.getByLabel('E-mail profissional').fill(email);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: /acessar sistema/i }).click();
}
