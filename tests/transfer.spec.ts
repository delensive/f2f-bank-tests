import { test, expect } from '@playwright/test';
import { registerAndLogin, addBalance } from './helpers';

test.describe('Перевод по номеру телефона', () => {

  test('Критический: успешный перевод при достаточном балансе', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 1000);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('500');
    await page.getByPlaceholder('e.g. debt repayment').fill('Test transfer');

    await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    await expect(page.getByRole('heading', { name: 'Balance: 500' })).toBeVisible();
  });

  test('Критический: перевод при недостаточном балансе должен быть отклонён', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('500');
    await page.getByPlaceholder('e.g. debt repayment').fill('Should fail');

    await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    await expect(page.getByRole('heading', { name: 'Balance: 100' })).toBeVisible();
  });

});