import { test, expect } from '@playwright/test';
import { entrar, EMAIL } from './e2e-helpers.js';

test.describe('Login', () => {
  test('credenciais válidas levam ao painel', async ({ page }) => {
    await entrar(page);
    // O primeiro login depois que o servidor sobe consulta o Supabase remoto e pode passar de 5 s.
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Painel de Controle' })).toBeVisible({ timeout: 10_000 });
  });

  test('senha errada mostra erro', async ({ page }) => {
    await entrar(page, EMAIL, 'senha-errada');
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('usuário inexistente mostra erro', async ({ page }) => {
    await entrar(page, 'ninguem@exemplo.com');
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible({ timeout: 10_000 });
  });
});
