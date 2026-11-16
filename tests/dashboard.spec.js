import { test, expect } from '@playwright/test';
import { entrar } from './e2e-helpers.js';

test.describe('Painel', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
    await page.waitForURL(/dashboard/, { timeout: 10_000 });
  });

  test('mostra os quatro cards de resumo', async ({ page }) => {
    for (const titulo of ['Total de Doadores', 'Bolsas em Estoque', 'Menor Estoque', 'Insumos em Baixo Estoque']) {
      await expect(page.getByText(titulo, { exact: true })).toBeVisible();
    }
  });

  test('menu lateral navega para Doadores', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Doadores' }).click();
    await expect(page).toHaveURL(/doadores/);
    await expect(page.getByRole('heading', { name: 'Gestão de Doadores' })).toBeVisible();
  });
});
