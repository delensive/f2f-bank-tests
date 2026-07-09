import { test, expect } from '@playwright/test';

test.describe('Регистрация пользователя', () => {

  test('Критический: успешная регистрация нового пользователя', async ({ page }) => {
    const uniqueEmail = `testuser_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;

    await page.goto('/register');

    await page.getByPlaceholder('Type your name').fill('Ivan');
    await page.getByPlaceholder('Type your surname').fill('Petrov');
    await page.getByPlaceholder('Type your email').fill(uniqueEmail);
    await page.getByPlaceholder('Type your message...').fill('SecurePass123!');

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/register') && resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Register' }).click(),
    ]);

    await expect(page).not.toHaveURL(/.*register/);
  });

});