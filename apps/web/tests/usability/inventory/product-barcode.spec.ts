import { expect, test, type Page } from '@playwright/test';

const internalBarcode = '2000000000015';

async function openProduct(page: Page, barcode: string | null) {
  const product = {
    id: 'barcode-product', sku: 'INT-001', name: 'Producto sin código de fábrica',
    barcode, unitPrice: 12.5, costPrice: 6, isService: false, isActive: true,
  };
  await page.addInitScript(() => {
    localStorage.setItem('atrio-auth', JSON.stringify({
      state: {
        token: 'test-token',
        user: { id: 'u-1', email: 'qa@atrio.test', name: 'QA', locale: 'es', enabledModules: [], permissions: [], tenantId: 't-1' },
      },
      version: 0,
    }));
    localStorage.setItem('x-tenant-id', 't-1');
  });
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/inventory/products/barcode-product/barcode' && route.request().method() === 'POST') {
      product.barcode = internalBarcode;
      return route.fulfill({ json: product });
    }
    if (path === '/api/v1/inventory/products/barcode-product') {
      return route.fulfill({ json: product });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/inventory/barcode-product');
  await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
}

test('generates a barcode for an existing product and prints EAN-13 copies', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openProduct(page, null);
  const generate = page.getByRole('button', { name: 'Generar código interno' });
  await generate.scrollIntoViewIfNeeded();
  await generate.click();
  await expect(generate).toHaveCount(0);

  const preview = page.locator('.print-label').first();
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toBeVisible();
  await expect(preview.locator('svg text:not(:empty)')).toHaveText(['2', '000000', '000015']);
  await expect(preview.locator('svg')).toHaveAttribute('aria-label', `Código de barras ${internalBarcode}`);
  await preview.screenshot({ path: '/tmp/ean13-label.png' });

  await page.getByRole('button', { name: 'Agregar una copia' }).click();
  await expect(page.locator('.print-sheet .print-label')).toHaveCount(2);
  await page.evaluate(() => { window.print = () => { document.body.dataset.printed = 'true'; }; });
  await page.getByRole('button', { name: 'Imprimir etiqueta' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'true');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-sheet')).toBeVisible();
  await expect(page.locator('.print-sheet .print-label svg text:not(:empty)')).toHaveText([
    '2', '000000', '000015', '2', '000000', '000015',
  ]);
  expect(errors).toEqual([]);
});

for (const barcode of [internalBarcode, 'SKU-001', '2000000000010']) {
  test(`renders existing barcode ${barcode} without changing its value`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openProduct(page, barcode);
    const preview = page.locator('.print-label').first();
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toBeVisible();
    await expect(preview.locator('svg text:not(:empty)')).toHaveText(
      barcode === internalBarcode ? ['2', '000000', '000015'] : [barcode],
    );
    await expect(page.getByRole('button', { name: 'Generar código interno' })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
