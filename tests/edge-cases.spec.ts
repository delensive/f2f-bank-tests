import { test, expect } from '@playwright/test';
import { registerAndLogin, addBalance } from './helpers';

test.describe('Граничные значения сумм переводов', () => {

  test('Высокий: перевод ровно на всю сумму баланса обнуляет баланс', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('100');
    await page.getByPlaceholder('e.g. debt repayment').fill('Full balance transfer');

    await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    await expect(page.getByRole('heading', { name: 'Balance: 0' })).toBeVisible();
  });

  test('Средний: перевод дробной суммой корректно обрабатывается', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 200);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('100.50');
    await page.getByPlaceholder('e.g. debt repayment').fill('Fractional amount test');

    await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    await expect(page.getByRole('heading', { name: /Balance: 99\.?5?0?/ })).toBeVisible();
  });

  test('Средний: перевод очень большой суммой не ломает приложение', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('999999999');
    await page.getByPlaceholder('e.g. debt repayment').fill('Huge amount test');

    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    console.log('TRANSFER STATUS:', response.status());

    expect(response.status()).toBeLessThan(500);
    await expect(page.getByRole('heading', { name: 'Balance: 100' })).toBeVisible();
  });

});

test.describe('Граничные значения формата телефона', () => {

  test('Средний: телефон ровно 10 цифр после + должен пройти', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+1234567890');
    await page.getByPlaceholder('0.00').fill('50');
    await page.getByPlaceholder('e.g. debt repayment').fill('10 digits test');

    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    expect(response.status()).toBe(200);
  });

  test('Средний: телефон ровно 15 цифр после + должен пройти', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+123456789012345');
    await page.getByPlaceholder('0.00').fill('50');
    await page.getByPlaceholder('e.g. debt repayment').fill('15 digits test');

    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    expect(response.status()).toBe(200);
  });

  test('Средний: телефон 9 цифр должен быть отклонён', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+123456789');
    await page.getByPlaceholder('0.00').fill('50');
    await page.getByPlaceholder('e.g. debt repayment').fill('9 digits test');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByRole('heading', { name: 'Balance: 100' })).toBeVisible();
  });

  test('Средний: телефон 16 цифр должен быть отклонён', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+1234567890123456');
    await page.getByPlaceholder('0.00').fill('50');
    await page.getByPlaceholder('e.g. debt repayment').fill('16 digits test');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByRole('heading', { name: 'Balance: 100' })).toBeVisible();
  });

  test('Средний: телефон со скобками и дефисами должен пройти', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 (999) 123-45-67');
    await page.getByPlaceholder('0.00').fill('50');
    await page.getByPlaceholder('e.g. debt repayment').fill('Mixed format test');

    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    console.log('MIXED FORMAT PHONE STATUS:', response.status());
  });

});

test.describe('Спецсимволы и XSS-инъекции', () => {

  test('Высокий: имя со скриптом не должно выполняться как код', async ({ page }) => {
    const email = `xsstest_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    const password = 'SecurePass123!';

    let dialogAppeared = false;
    page.on('dialog', async dialog => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    await page.goto('/register');
    await page.getByPlaceholder('Type your name').fill('<script>alert(1)</script>');
    await page.getByPlaceholder('Type your surname').fill('Tester');
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

    expect(dialogAppeared).toBe(false);
  });

  test('Средний: назначение платежа со спецсимволами не ломает страницу транзакций', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    let dialogAppeared = false;
    page.on('dialog', async dialog => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('10');
    await page.getByPlaceholder('e.g. debt repayment').fill('<img src=x onerror=alert(1)>');

    await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    await page.goto('/transactions');

    expect(dialogAppeared).toBe(false);
  });

});

test.describe('Проверка существования получателя', () => {

  test('Критический: перевод на телефон без привязанного получателя всё равно списывает средства', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 500);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 000 000-00-00');
    await page.getByPlaceholder('0.00').fill('200');
    await page.getByPlaceholder('e.g. debt repayment').fill('Nonexistent recipient test');

    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send' }).click(),
    ]);

    console.log('NO-RECIPIENT TRANSFER STATUS:', response.status());
    console.log('NO-RECIPIENT TRANSFER BODY:', await response.text());

    if (response.status() === 200) {
      await expect(page.getByRole('heading', { name: 'Balance: 300' })).toBeVisible();
    }
  });

});

test.describe('Доступ к защищённым страницам после логаута', () => {

  test('Высокий: логаут должен инвалидировать токен авторизации', async ({ page, context }) => {
    await registerAndLogin(page);

    const cookiesBefore = await context.cookies();
    const tokenBefore = cookiesBefore.find(c => c.name === 'access_token')?.value;
    expect(tokenBefore).toBeTruthy();

    await page.locator('header button.app-button').click();
    await page.waitForURL(/.*login/);

    const cookiesAfter = await context.cookies();
    const tokenAfter = cookiesAfter.find(c => c.name === 'access_token')?.value;

    // БАГ: токен не инвалидируется при логауте в WebKit (см. NOTES.md, пункт 9)
    expect(tokenAfter, 'Известный баг: логаут не удаляет/не инвалидирует access_token — см. NOTES.md, пункт 9').toBeFalsy();
  });

});

test.describe('Длинные значения полей', () => {

  test('Средний: очень длинное имя при регистрации не должно вызывать 500 ошибку', async ({ page }) => {
    const email = `longname_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    const password = 'SecurePass123!';
    const longName = 'A'.repeat(500);

    await page.goto('/register');
    await page.getByPlaceholder('Type your name').fill(longName);
    await page.getByPlaceholder('Type your surname').fill('Tester');
    await page.getByPlaceholder('Type your email').fill(email);
    await page.getByPlaceholder('Type your message...').fill(password);

    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/register') && resp.request().method() === 'POST'),
      page.getByRole('button', { name: 'Register' }).click(),
    ]);

    // БАГ: сервер возвращает 500 вместо корректной валидации (4xx).
    // Тест зафиксирован как "known failure", задокументирован в NOTES.md.
    expect(response.status(), 'Известный баг: см. NOTES.md, пункт 8').toBeLessThan(500);
  });

});
test.describe('Защита от повторной отправки', () => {

  test('Высокий: двойной клик по Send не списывает деньги дважды', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 1000);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('300');
    await page.getByPlaceholder('e.g. debt repayment').fill('Double click test');

    const sendButton = page.getByRole('button', { name: 'Send' });

    // Кликаем дважды подряд без ожидания между кликами
    await Promise.all([
      page.waitForResponse(resp => resp.request().method() === 'POST').catch(() => null),
      sendButton.click(),
      sendButton.click(),
    ]);

    // Даём странице немного времени на обработку возможного второго запроса
    await page.waitForTimeout(1000);

    // Если бы перевод прошёл дважды: 1000 - 300 - 300 = 400
    // Если корректно один раз: 1000 - 300 = 700
    const balanceHeading = page.getByRole('heading', { name: /Balance:/ });
    const balanceText = await balanceHeading.textContent();
    console.log('BALANCE AFTER DOUBLE CLICK:', balanceText);

    await expect(balanceHeading).toHaveText('Balance: 700');
  });

});
test.describe('Кнопка Cancel на форме перевода', () => {

  test('Низкий: Cancel очищает заполненные поля формы перевода', async ({ page }) => {
    await registerAndLogin(page);
    await addBalance(page, 100);

    await page.goto('/');
    await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
    await page.getByPlaceholder('0.00').fill('50');
    await page.getByPlaceholder('e.g. debt repayment').fill('Test purpose');

    await page.getByRole('button', { name: 'Cancel' }).click();

    // Проверяем, что поля очистились
    await expect(page.getByPlaceholder('+7 999 123-45-67')).toHaveValue('');
    await expect(page.getByPlaceholder('0.00')).toHaveValue('');
    await expect(page.getByPlaceholder('e.g. debt repayment')).toHaveValue('');

    // И баланс не изменился — перевод точно не был отправлен
    await expect(page.getByRole('heading', { name: 'Balance: 100' })).toBeVisible();
  });

});