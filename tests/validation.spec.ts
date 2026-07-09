import { test, expect } from '@playwright/test';
import { registerAndLogin, addBalance } from './helpers';

test.describe('Валидация переводов', () => {

  test('Высокий: перевод с некорректным номером телефона (без +) должен быть отклонён', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 1000);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('89991112233');
    await page.getByPlaceholder('0.00').fill('100');
    await page.getByPlaceholder('e.g. debt repayment').fill('Invalid phone test');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByRole('heading', { name: 'Balance: 1000' })).toBeVisible();
  });

  test('Средний: перевод с суммой 0 должен быть отклонён', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 1000);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('0');
    await page.getByPlaceholder('e.g. debt repayment').fill('Zero amount test');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByRole('heading', { name: 'Balance: 1000' })).toBeVisible();
  });

  test('Средний: перевод с отрицательной суммой должен быть отклонён', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 1000);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('-100');
    await page.getByPlaceholder('e.g. debt repayment').fill('Negative amount test');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByRole('heading', { name: 'Balance: 1000' })).toBeVisible();
  });

});

test.describe('Валидация регистрации', () => {

  test('Высокий: регистрация с уже существующим email должна быть отклонена', async ({ page }) => {
    const email = `duplicate_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    const password = 'SecurePass123!';

    await page.goto('/register');
    await page.getByPlaceholder('Type your name').fill('First');
    await page.getByPlaceholder('Type your surname').fill('User');
    await page.getByPlaceholder('Type your email').fill(email);
    await page.getByPlaceholder('Type your message...').fill(password);

    const [firstResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/register') && resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Register' }).click(),
    ]);
    expect(firstResponse.status()).toBeLessThan(300);

    await page.goto('/register');
    await page.getByPlaceholder('Type your name').fill('Second');
    await page.getByPlaceholder('Type your surname').fill('User');
    await page.getByPlaceholder('Type your email').fill(email);
    await page.getByPlaceholder('Type your message...').fill(password);

    const [secondResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/register') && resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Register' }).click(),
    ]);

    expect(secondResponse.status()).toBeGreaterThanOrEqual(400);
  });

  test('Средний: поле email должно валидировать формат при вводе некорректного значения', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Type your email').fill('not-an-email');
    await page.getByPlaceholder('Type your email').blur();

    await expect(page.getByText(/email|адрес/i)).toBeVisible();
  });

});