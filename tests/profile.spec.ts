import { test, expect } from '@playwright/test';

test.describe('Профиль пользователя', () => {

  test('Низкий: профиль отображает корректные данные пользователя', async ({ page }) => {
    const email = `profiletest_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    const password = 'SecurePass123!';

    await page.goto('/register');
    await page.getByPlaceholder('Type your name').fill('Sergey');
    await page.getByPlaceholder('Type your surname').fill('Volkov');
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

    await page.goto('/profile');

    await expect(page.getByText('Sergey')).toBeVisible();
    await expect(page.getByText('Volkov')).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

});