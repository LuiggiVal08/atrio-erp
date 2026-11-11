import { test, expect } from '@playwright/test';
import { setupMocks, openPOS, addProductToCart, payExactAmount } from './helpers';

test.describe('Keyboard: Complete Sale (Zero Mouse)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await openPOS(page);
  });

  test('full flow: 1 product, exact cash, no mouse', async ({ page }) => {
    // Step 1: Search and add product
    await addProductToCart(page, 'clavo');

    // Step 2: Open payment
    await page.keyboard.press('F8');
    await page.waitForTimeout(200);

    // Step 3: Pay exact amount with the keyboard
    await payExactAmount(page);

    // Should show receipt
    await expect(page.getByRole('heading', { name: 'Venta completada' })).toBeVisible();
  });

  test('full flow: 3 products, exact cash, no mouse', async ({ page }) => {
    // Add 3 products
    for (const product of ['clavo', 'tornillo', 'disco']) {
      await addProductToCart(page, product);
    }

    // Verify 3 items in cart
    const lines = page.locator('[role="listitem"]');
    await expect(lines).toHaveCount(3);

    // Navigate cart with keyboard
    await page.keyboard.press('End');
    await page.waitForTimeout(100);
    await page.keyboard.press('+');
    await page.waitForTimeout(100);

    // Open payment
    await page.keyboard.press('F8');
    await page.waitForTimeout(200);

    // Complete sale with exact amount
    await payExactAmount(page);

    await expect(page.getByRole('heading', { name: 'Venta completada' })).toBeVisible();
  });

  test('full flow: with registered customer', async ({ page }) => {
    // Add product
    await addProductToCart(page, 'clavo');

    // Search customer
    await page.keyboard.press('F4');
    await page.waitForTimeout(100);
    await page.keyboard.type('tornillo', { delay: 250 });
    await page.getByText('Ferretería El Tornillo').waitFor();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Should show customer name
    await expect(page.getByRole('button', { name: /Ferretería El Tornillo/ })).toBeVisible();

    // Complete sale with exact amount
    await page.keyboard.press('F8');
    await page.waitForTimeout(200);
    await payExactAmount(page);

    await expect(page.getByRole('heading', { name: 'Venta completada' })).toBeVisible();
  });

  test('full flow: 10 consecutive sales without failure', async ({ page }) => {
    test.setTimeout(120000);

    for (let i = 0; i < 10; i++) {
      // Add product
      await addProductToCart(page, 'clavo');

      // Pay with exact amount
      await page.keyboard.press('F8');
      await page.waitForTimeout(200);
      await payExactAmount(page);

      // New sale
      await page.keyboard.press('Control+n');
      await page.waitForTimeout(300);
    }

    // After 10 sales, should be back at search
    const searchInput = page.getByPlaceholder(/Buscar producto/);
    await expect(searchInput).toBeFocused();
  });
});
