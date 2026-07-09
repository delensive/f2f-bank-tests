import { Page, expect } from '@playwright/test';

export async function registerAndLogin(page: Page): Promise<{ email: string; password: string }> {
  const email = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'SecurePass123!';

  await page.goto('/register');
  await page.getByPlaceholder('Type your name').fill('Test');
  await page.getByPlaceholder('Type your surname').fill('User');
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

  return { email, password };
}

export async function addBalance(page: Page, amount: number): Promise<void> {
  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Add balance' }).click();
  await page.getByPlaceholder('Enter sum').fill(amount.toString());

  await Promise.all([
    page.waitForResponse(resp => resp.request().method() === 'POST' && resp.status() < 400),
    page.getByRole('button', { name: 'Add', exact: true }).click(),
  ]);
}