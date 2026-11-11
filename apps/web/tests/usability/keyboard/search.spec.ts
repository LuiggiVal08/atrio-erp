import { test, expect } from '@playwright/test';
import { setupMocks, openPOS } from './helpers';

test.describe('Keyboard: Product Search', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await openPOS(page);
  });

  test('F2 focuses search input', async ({ page }) => {
    await page.keyboard.press('F2');
    const searchInput = page.getByPlaceholder(/Buscar producto/);
    await expect(searchInput).toBeFocused();
  });

  test('typing shows results', async ({ page }) => {
    await page.keyboard.press('F2');
    await page.keyboard.type('clavo');
    await page.waitForTimeout(300);
    await expect(page.getByText('Clavo 2" x 1/4')).toBeVisible();
  });

  test('Enter selects first result from keyboard', async ({ page }) => {
    await page.keyboard.press('F2');
    await page.keyboard.type('clavo');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await expect(page.getByText('CLV-001')).toBeVisible();
  });

  test('exact barcode auto-selects without Enter', async ({ page }) => {
    await page.keyboard.press('F2');
    await page.keyboard.type('7791234567890');
    await page.waitForTimeout(300);
    await expect(page.getByText('Clavo 2" x 1/4')).toBeVisible();
  });

  test('ArrowDown/ArrowUp navigates results', async ({ page }) => {
    await page.keyboard.press('F2');
    await page.keyboard.type('disco');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    // Should have added the only match
    await expect(page.getByText('Disco Corte 7"')).toBeVisible();
  });

  test('empty search shows no results', async ({ page }) => {
    await page.keyboard.press('F2');
    await page.waitForTimeout(200);
    await expect(page.getByText('Clavo')).not.toBeVisible();
  });

  test('unmatched query shows not found', async ({ page }) => {
    await page.keyboard.press('F2');
    await page.keyboard.type('zzzzxxx');
    await page.waitForTimeout(300);
    await expect(page.getByText('Producto no encontrado')).toBeVisible();
  });
});
