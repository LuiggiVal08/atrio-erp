import { test, expect } from '@playwright/test';
import { setupMocks, openPOS } from './helpers';

test.describe('Keyboard: Scanner Input', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await openPOS(page);
  });

  test('rapid barcode input followed by Enter adds product', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar producto/);
    await expect(searchInput).toBeFocused();

    // Simulate scanner: rapid chars (<200ms interval) + Enter
    const barcode = '7791234567890';
    for (const char of barcode) {
      await page.keyboard.press(char);
      await page.waitForTimeout(10);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    await expect(page.getByText('Clavo 2" x 1/4')).toBeVisible();
  });

  test('slow typing does not trigger scanner auto-add', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar producto/);
    await expect(searchInput).toBeFocused();

    // Slow typing (>200ms between chars)
    const barcode = '7791234567890';
    for (const char of barcode) {
      await page.keyboard.press(char);
      await page.waitForTimeout(250);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Should still show results since it's a manual search
    await expect(page.getByText('Clavo 2" x 1/4')).toBeVisible();
  });

  test('scanner adds product and returns focus to search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar producto/);
    await expect(searchInput).toBeFocused();

    // Scanner scan
    const barcode = '7791234567890';
    for (const char of barcode) {
      await page.keyboard.press(char);
      await page.waitForTimeout(10);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Product added
    await expect(page.getByText('Clavo 2" x 1/4')).toBeVisible();

    // Focus back on search
    await expect(searchInput).toBeFocused();
    // Search input should be cleared
    await expect(searchInput).toHaveValue('');
  });

  test('scanner + Enter adds exact barcode match immediately', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar producto/);
    await expect(searchInput).toBeFocused();

    const barcode = '7791234567892';
    for (const char of barcode) {
      await page.keyboard.press(char);
      await page.waitForTimeout(10);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Product should be in cart (auto-selected by exact barcode match)
    await expect(page.getByText('Cable THHN #12')).toBeVisible();
  });
});
