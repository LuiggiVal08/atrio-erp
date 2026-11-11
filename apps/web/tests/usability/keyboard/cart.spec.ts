import { test, expect } from '@playwright/test';
import { setupMocks, openPOS, addProductToCart } from './helpers';

test.describe('Keyboard: Cart Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await openPOS(page);
    // Add two products for navigation tests
    await addProductToCart(page, 'clavo');
    await addProductToCart(page, 'tornillo');
  });

  test('ArrowDown moves selection to next line', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    // Second line should be highlighted (bg-blue-50)
    const lines = page.locator('[role="listitem"]');
    await expect(lines.nth(1)).toHaveClass(/bg-blue-50/);
  });

  test('ArrowUp moves selection to previous line', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    const lines = page.locator('[role="listitem"]');
    await expect(lines.nth(0)).toHaveClass(/bg-blue-50/);
  });

  test('Home goes to first line', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);
    const lines = page.locator('[role="listitem"]');
    await expect(lines.nth(0)).toHaveClass(/bg-blue-50/);
  });

  test('End goes to last line', async ({ page }) => {
    await page.keyboard.press('End');
    await page.waitForTimeout(100);
    const lines = page.locator('[role="listitem"]');
    await expect(lines.nth(1)).toHaveClass(/bg-blue-50/);
  });

  test('+ increases quantity of selected line', async ({ page }) => {
    await page.keyboard.press('End');
    await page.waitForTimeout(100);
    await page.keyboard.press('+');
    await page.waitForTimeout(100);
    const lines = page.locator('[role="listitem"]');
    // Second item quantity should be 2 (1 + 1)
    await expect(lines.nth(1).getByText('2', { exact: true })).toBeVisible();
  });

  test('- decreases quantity of selected line', async ({ page }) => {
    // First add 1 more to have qty > 1, then navigate and decrement
    await addProductToCart(page, 'clavo');
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);
    await page.keyboard.press('-');
    await page.waitForTimeout(100);
    const lines = page.locator('[role="listitem"]');
    await expect(lines.nth(0).getByText('1', { exact: true })).toBeVisible();
  });

  test('Delete removes selected line', async ({ page }) => {
    await page.keyboard.press('End');
    await page.waitForTimeout(100);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    const lines = page.locator('[role="listitem"]');
    await expect(lines).toHaveCount(1);
    // Should show the remaining product
    await expect(page.getByText('Clavo 2" x 1/4')).toBeVisible();
  });

  test('Ctrl+X removes selected line', async ({ page }) => {
    await page.keyboard.press('End');
    await page.waitForTimeout(100);
    await page.keyboard.press('Control+x');
    await page.waitForTimeout(100);
    const lines = page.locator('[role="listitem"]');
    await expect(lines).toHaveCount(1);
  });

  test('Ctrl+D decreases quantity of selected line', async ({ page }) => {
    await addProductToCart(page, 'clavo');
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(100);
    const lines = page.locator('[role="listitem"]');
    await expect(lines.nth(0).getByText('1', { exact: true })).toBeVisible();
  });
});
