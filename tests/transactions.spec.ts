import { test, expect } from '@playwright/test';
import { registerAndLogin, addBalance } from './helpers';

test.describe('История транзакций', () => {

  test('Высокий: после пополнения баланса появляется запись в истории', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 1000);

    await page.goto('/transactions');

    await expect(page.getByText('No transactions yet')).not.toBeVisible();
    await expect(page.getByRole('table').getByText('1000')).toBeVisible();
  });

  test('Высокий: после перевода появляется запись в истории', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 1000);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('300');
    await page.getByPlaceholder('e.g. debt repayment').fill('Test payment');

    await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    await page.goto('/transactions');

    await expect(page.getByRole('table').getByText('300')).toBeVisible();
  });

  test('Средний: у нового пользователя нет транзакций', async ({ page }) => {
    await registerAndLogin(page);

    await page.goto('/transactions');

    await expect(page.getByText('No transactions yet')).toBeVisible();
  });

});