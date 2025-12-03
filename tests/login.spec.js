import {expect, test } from '@playwright/test';

test('user login with sucess', async ( { page } )=>{
    await page.goto('https://descarte.vercel.app/');
   
    await page.locator('[class=\'menu-faketrigger\']').click();
    await page.locator('a:has-text("Entrar")').click();
    await page.getByLabel('Informe seu nome de usuário:').fill('Bruno Augusto');
    await page.getByLabel('Informe sua senha de acesso:').click();
    await page.getByLabel('Informe sua senha de acesso:').fill('921020');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Redirecionando...')).toBeVisible();
});