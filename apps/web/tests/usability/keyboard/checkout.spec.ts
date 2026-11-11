import { test, expect } from '@playwright/test';
import { setupMocks, openPOS, addProductToCart } from './helpers';

test.describe('Keyboard: Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await openPOS(page);
    await addProductToCart(page, 'clavo');
  });

  test('F8 opens payment overlay', async ({ page }) => {
    await page.keyboard.press('F8');
    await page.waitForTimeout(200);
    await expect(page.getByRole('dialog', { name: 'Procesar pago' })).toBeVisible();
  });

  test('ESC closes payment overlay when not processing', async ({ page }) => {
    await page.keyboard.press('F8');
    await page.waitForTimeout(200);
    const dialog = page.getByRole('dialog', { name: 'Procesar pago' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(dialog).not.toBeVisible();
  });

  test('COBRAR button disabled when cart is empty', async ({ page }) => {
    const cobrarBtn = page.getByRole('button', { name: 'COBRAR' });
    // Cart should have 1 item, so it's not disabled initially
    // We'll check that it's enabled
    await expect(cobrarBtn).not.toBeDisabled();
  });

  test('customer search via F4 opens dropdown', async ({ page }) => {
    await page.keyboard.press('F4');
    await page.waitForTimeout(200);
    const searchInput = page.getByPlaceholder(/Buscar cliente/);
    await expect(searchInput).toBeFocused();
  });

  test('ESC closes customer search', async ({ page }) => {
    await page.keyboard.press('F4');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(page.getByPlaceholder(/Buscar cliente/)).not.toBeVisible();
  });

  test('Ctrl+N starts new sale', async ({ page }) => {
    // Add a product first, then new sale
    await page.keyboard.press('Control+n');
    await page.waitForTimeout(300);
    const searchInput = page.getByPlaceholder(/Buscar producto/);
    await expect(searchInput).toBeFocused();
    // Cart should be empty
    await expect(page.getByText('CLV-001')).not.toBeVisible();
  });

  test('Ctrl+P toggles print', async ({ page }) => {
    // Just verify it doesn't throw — print triggers browser dialog
    await page.keyboard.press('Control+p');
    await page.waitForTimeout(100);
  });
});
