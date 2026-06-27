import { test, expect } from '@playwright/test';

// Test assumes backend is running at http://127.0.0.1:8000
// and frontend at http://localhost:5173 (or http://127.0.0.1:5173)

test.describe('Login Flow', () => {
  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Fill credentials (admin created by seed_data.py)
    await page.getByLabel('E-mail').fill('admin@pulse.com');
    await page.getByLabel('Senha').fill('12345678');

    await page.getByRole('button', { name: /acessar sistema/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Dashboard should show some content
    await expect(page.getByText('Painel de Controle')).toBeVisible({ timeout: 10000 });
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    await page.getByLabel('E-mail').fill('admin@pulse.com');
    await page.getByLabel('Senha').fill('wrongpassword');

    await page.getByRole('button', { name: /acessar sistema/i }).click();

    // Should show error message
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible({ timeout: 5000 });
  });

  test('login with non-existent user shows error', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    await page.getByLabel('E-mail').fill('nobody@fake.com');
    await page.getByLabel('Senha').fill('12345678');

    await page.getByRole('button', { name: /acessar sistema/i }).click();

    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible({ timeout: 5000 });
  });
});
