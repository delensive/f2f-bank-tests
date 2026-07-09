import { test, expect } from '@playwright/test';

test.describe('Вход в систему', () => {

  test('Критический: успешный вход с валидными данными', async ({ page }) => {
    const email = `logintest_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    const password = 'SecurePass123!';

    await page.goto('/register');
    await page.getByPlaceholder('Type your name').fill('Anna');
    await page.getByPlaceholder('Type your surname').fill('Ivanova');
    await page.getByPlaceholder('Type your email').fill(email);
    await page.getByPlaceholder('Type your message...').fill(password);

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/register') && resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Register' }).click(),
    ]);

    await page.goto('/login');
    await page.getByPlaceholder('Type your email').fill(email);
    await page.getByPlaceholder('Type your password').fill(password);

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/login') && resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Login' }).click(),
    ]);

    await expect(page.getByRole('heading', { name: /Balance:/ })).toBeVisible();
  });

  test('Высокий: вход с неверным паролем', async ({ page }) => {
    const email = `wrongpass_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    const password = 'SecurePass123!';

    await page.goto('/register');
    await page.getByPlaceholder('Type your name').fill('Boris');
    await page.getByPlaceholder('Type your surname').fill('Sidorov');
    await page.getByPlaceholder('Type your email').fill(email);
    await page.getByPlaceholder('Type your message...').fill(password);

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/register') && resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Register' }).click(),
    ]);

    await page.goto('/login');
    await page.getByPlaceholder('Type your email').fill(email);
    await page.getByPlaceholder('Type your password').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/.*login/);
  });

});