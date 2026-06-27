import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/');
    await page.getByLabel('E-mail').fill('admin@pulse.com');
    await page.getByLabel('Senha').fill('12345678');
    await page.getByRole('button', { name: /acessar sistema/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });

  test('dashboard loads with stats cards', async ({ page }) => {
    // Should show the 4 stat cards
    await expect(page.getByText('Total de Doadores')).toBeVisible();
    await expect(page.getByText('Bolsas em Estoque')).toBeVisible();
    await expect(page.getByText('Coletas Hoje')).toBeVisible();
    await expect(page.getByText('Nível Crítico')).toBeVisible();
  });

  test('sidebar navigation works', async ({ page }) => {
    // Navigate to Doadores
    await page.getByRole('link', { name: /doadores/i }).click();
    await expect(page).toHaveURL(/doadores/);
    await expect(page.getByText('Gestão de Doadores')).toBeVisible();
  });
});
