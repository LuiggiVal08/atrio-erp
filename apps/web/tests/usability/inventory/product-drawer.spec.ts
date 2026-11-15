import { expect, test, type Page } from '@playwright/test';

async function openProductDrawer(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('atrio-auth', JSON.stringify({
      state: {
        token: 'test-token',
        user: { id: 'u-1', email: 'qa@atrio.test', name: 'QA', locale: 'es', enabledModules: [], permissions: ['inventory:product:create'], tenantId: 't-1' },
      },
      version: 0,
    }));
    localStorage.setItem('x-tenant-id', 't-1');
  });
  await page.route('**/api/v1/**', (route) => {
    if (route.request().url().includes('/inventory/products/summary')) {
      return route.fulfill({
        json: {
          totalProducts: 0,
          stockHealth: { healthy: 0, low: 0, out: 0, overstock: 0 },
          valuation: { currency: 'USD', totalValue: 0, categories: [] },
          coverage: { periodDays: 30, medianDays: null, under7: 0, from7to30: 0, over30: 0, noSales: 0 },
        },
      });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/inventory/products');
  await page.getByRole('button', { name: 'Crear producto' }).click();
  const drawer = page.getByRole('dialog', { name: /Crear producto/ });
  await expect(drawer).toBeVisible();
  return drawer;
}

async function expectDockedRight(page: Page) {
  const viewport = page.viewportSize()!;
  await expect.poll(async () => {
    const box = await page.getByRole('dialog').boundingBox();
    return box ? Math.round(box.x + box.width) : 0;
  }).toBe(viewport.width);
}

test('opens on the right and closes with Escape, X and Cancel', async ({ page }) => {
  const create = page.getByRole('button', { name: 'Crear producto' });
  const drawer = await openProductDrawer(page);
  await expect(drawer).toHaveAttribute('data-placement', 'right');
  await expectDockedRight(page);
  await expect(page.locator('[data-slot="drawer-content"]')).toHaveAttribute('data-placement', 'right');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(create).toBeFocused();

  await create.click();
  await drawer.getByRole('button', { name: 'Cerrar' }).click();
  await expect(drawer).toBeHidden();

  await create.click();
  await drawer.getByRole('button', { name: 'Cancelar' }).click();
  await expect(drawer).toBeHidden();
});

test('keeps the last fields and actions reachable on a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 560 });
  const drawer = await openProductDrawer(page);
  await expectDockedRight(page);
  await drawer.getByLabel('Servicio', { exact: true }).scrollIntoViewIfNeeded();
  await drawer.getByLabel('Servicio', { exact: true }).check();
  await expect(drawer.getByLabel('Servicio', { exact: true })).toBeChecked();
  const saveBox = await drawer.getByRole('button', { name: 'Guardar' }).boundingBox();
  expect(saveBox!.y + saveBox!.height).toBeLessThanOrEqual(560);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await drawer.getByLabel('Servicio', { exact: true }).uncheck();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(drawer.getByRole('button', { name: 'Guardar' })).toBeInViewport();
});

test('retains inputs on failure and closes only after saving', async ({ page }) => {
  const drawer = await openProductDrawer(page);
  await drawer.getByLabel('SKU', { exact: true }).fill('TEST-001');
  await drawer.getByLabel('Nombre', { exact: true }).fill('Producto de prueba');
  await drawer.getByLabel('Costo de compra', { exact: true }).fill('10');
  await drawer.getByLabel('Precio de venta', { exact: true }).fill('15');

  let submissions = 0;
  await page.route('**/api/v1/inventory/products', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    submissions += 1;
    expect(route.request().postDataJSON()).toMatchObject({
      sku: 'TEST-001', name: 'Producto de prueba', costPrice: 10, unitPrice: 15,
    });

    return route.fulfill({
      status: submissions === 1 ? 400 : 201,
      json: submissions === 1 ? { message: ['El producto no se pudo guardar'] } : { id: 'new-product' },
    });
  });

  await drawer.getByRole('button', { name: 'Guardar' }).click();
  await expect(drawer.getByRole('alert')).toContainText('El producto no se pudo guardar');
  await expect(drawer.getByLabel('SKU', { exact: true })).toHaveValue('TEST-001');
  await drawer.getByRole('button', { name: 'Guardar' }).click();
  await expect(drawer).toBeHidden();
  expect(submissions).toBe(2);
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await expect(page.getByRole('dialog').getByLabel('SKU', { exact: true })).toHaveValue('');
});

test('generates an internal barcode from the SKU before saving', async ({ page }) => {
  const drawer = await openProductDrawer(page);
  const generate = drawer.getByRole('button', { name: 'Generar desde SKU' });

  await expect(generate).toBeDisabled();
  await drawer.getByLabel('SKU', { exact: true }).fill('SKU-001');
  await expect(generate).toBeEnabled();
  await generate.click();

  await expect(drawer.getByLabel('Código de barras', { exact: true })).toHaveValue('SKU-001');
});