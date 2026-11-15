import { expect, test, type Page, type Route } from '@playwright/test';

const productId = '550e8400-e29b-41d4-a716-446655440001';
const warehouseId = '550e8400-e29b-41d4-a716-446655440002';
const branchId = '550e8400-e29b-41d4-a716-446655440003';
const product = { id: productId, sku: 'TUB-01', name: 'Tubo flexible', isActive: true, isService: false, baseUnit: 'metro', minStock: 0, maxStock: null, costPrice: 2, unitPrice: 4 };
const warehouse = { id: warehouseId, name: 'Principal', code: 'PRI', branchId, isActive: true };

async function setup(page: Page, initial: number | null = null) {
  let quantity = initial;
  const adjustments: Record<string, any>[] = [];
  const queries: URLSearchParams[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('atrio-auth', JSON.stringify({ state: { token: 'test-token', user: { id: 'u1', name: 'QA', email: 'qa@atrio.test', locale: 'es', tenantId: 't1', permissions: ['inventory:stock:read', 'inventory:stock:adjust'], enabledModules: [] } }, version: 0 }));
    localStorage.setItem('atrio-tenant', JSON.stringify({ state: { activeTenantId: 't1' }, version: 0 }));
    localStorage.setItem('x-tenant-id', 't1');
  });
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1', '');
    if (path === '/inventory/stock') return route.fulfill({ json: quantity === null ? [] : [{ id: 's1', productId, warehouseId, quantity, product, warehouse, updatedAt: '2026-11-14T12:00:00Z' }] });
    if (path === `/inventory/stock/${productId}/${warehouseId}/adjust`) {
      const body = route.request().postDataJSON(); adjustments.push(body);
      quantity = (quantity ?? 0) + (body.type === 'in' ? body.quantity : -body.quantity);
      return route.fulfill({ json: { data: { quantity } } });
    }
    if (path === '/inventory/stock/movements') {
      queries.push(url.searchParams);
      const currentPage = Number(url.searchParams.get('page') ?? 1);
      return route.fulfill({ json: { items: [{ id: `m-${currentPage}`, productId, warehouseId, product, warehouse, type: 'in', quantity: 0.125, referenceId: `Movimiento página ${currentPage}`, createdAt: '2026-11-14T12:00:00Z' }], total: 650, page: currentPage, pageSize: 25 } });
    }
    if (path === '/inventory/products') return route.fulfill({ json: { items: [product], total: 1 } });
    if (path === '/inventory/warehouses') return route.fulfill({ json: { data: [warehouse] } });
    if (path === '/inventory/branches') return route.fulfill({ json: { data: [{ id: branchId, name: 'Centro', isActive: true }] } });
    if (path === '/tenants/t1') return route.fulfill({ json: { data: { id: 't1', baseCurrency: 'USD' } } });
    return route.fulfill({ json: [] });
  });
  return { adjustments, queries };
}

async function openInitial(page: Page) {
  await page.goto('/inventory/stock');
  await page.getByRole('button', { name: 'Registrar existencia', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Producto').selectOption(productId);
  await dialog.getByLabel('Almacén').selectOption(warehouseId);
  await dialog.getByLabel('Cantidad', { exact: true }).fill('0.125');
  await dialog.getByLabel('Motivo', { exact: true }).fill('Saldo inicial');
  return dialog;
}

test('registers the first fractional balance and refreshes its row', async ({ page }) => {
  const { adjustments } = await setup(page);
  const dialog = await openInitial(page);
  await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
  await expect(dialog).toBeHidden();
  expect(adjustments).toHaveLength(1);
  expect(adjustments[0]).toMatchObject({ quantity: 0.125, type: 'in', reason: 'Saldo inicial', operationId: expect.any(String) });
  await expect(page.getByRole('cell', { name: '0,125 metro' })).toBeVisible();
});

test('retains values and the operation ID when retrying an unconfirmed save', async ({ page }) => {
  await setup(page);
  const attempts: Record<string, any>[] = [];
  await page.route('**/adjust', route => {
    attempts.push(route.request().postDataJSON());
    return route.fulfill(attempts.length === 1 ? { status: 503, json: { message: 'No confirmado' } } : { json: { data: { quantity: 0.125 } } });
  });
  const dialog = await openInitial(page);
  await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByLabel('Cantidad', { exact: true })).toHaveValue('0.125');
  await expect(dialog.getByLabel('Motivo', { exact: true })).toHaveValue('Saldo inicial');
  await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
  await expect(dialog).toBeHidden();
  expect(attempts).toHaveLength(2);
  expect(attempts[0].operationId).toBe(attempts[1].operationId);
});

test('sends only the physical-count difference with its original balance', async ({ page }) => {
  const { adjustments } = await setup(page, 5);
  await page.goto('/inventory/stock');
  await page.getByRole('button', { name: 'Ajustar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tipo').selectOption('count');
  await dialog.getByLabel('Cantidad contada').fill('4.125');
  await dialog.getByLabel('Motivo', { exact: true }).fill('Conteo físico');
  await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
  await expect(dialog).toBeHidden();
  expect(adjustments[0]).toMatchObject({ type: 'out', quantity: 0.875, expectedQuantity: 5 });
  await expect(page.getByRole('cell', { name: '4,125 metro' })).toBeVisible();
});

test('keeps a stale physical count open instead of reporting success', async ({ page }) => {
  await setup(page, 5);
  await page.route('**/adjust', route => route.fulfill({ status: 409, json: { message: 'El stock cambió; vuelve a contar.' } }));
  await page.goto('/inventory/stock');
  await page.getByRole('button', { name: 'Ajustar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tipo').selectOption('count');
  await dialog.getByLabel('Cantidad contada').fill('4');
  await dialog.getByLabel('Motivo', { exact: true }).fill('Conteo físico');
  await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
  await expect(dialog.getByRole('alert')).toContainText('stock cambió');
  await expect(dialog.getByLabel('Cantidad contada')).toHaveValue('4');
});

test('uses server date and branch filters and resets the page when filtering', async ({ page }) => {
  const { queries } = await setup(page);
  await page.goto('/inventory/stock?tab=movements');
  await page.getByRole('button', { name: /siguiente/i }).click();
  await expect(page.getByText('Movimiento página 2')).toBeVisible();
  await page.getByLabel('Desde').fill('2026-11-01');
  await page.getByLabel('Hasta').fill('2026-11-14');
  await page.getByLabel('Sucursal', { exact: true }).selectOption(branchId);
  await expect.poll(() => queries.at(-1)?.get('branchId')).toBe(branchId);
  expect(queries.at(-1)?.get('dateFrom')).toBe('2026-11-01');
  expect(queries.at(-1)?.get('dateTo')).toBe('2026-11-14');
  expect(queries.at(-1)?.get('page')).toBe('1');
  await page.getByRole('button', { name: /siguiente/i }).click();
  await expect(page.getByText('Movimiento página 2')).toBeVisible();
  await page.getByRole('textbox', { name: /buscar/i }).fill('Tubo');
  await expect.poll(() => queries.at(-1)?.get('search')).toBe('Tubo');
  expect(queries.at(-1)?.get('page')).toBe('1');
});

test('does not display an empty success after a failed stock read', async ({ page }) => {
  await setup(page);
  await page.route('**/api/v1/inventory/stock', route => route.fulfill({ status: 403, json: { message: 'Sin permiso' } }));
  await page.goto('/inventory/stock');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByText('No hay existencias registradas')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toBeVisible();
});

test('preserves fine fractional quantities in balances and count previews', async ({ page }) => {
  await setup(page, 0.123456);
  await page.goto('/inventory/stock');
  await expect(page.getByRole('cell', { name: '0,123456 metro' })).toBeVisible();
  await page.getByRole('button', { name: 'Ajustar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tipo').selectOption('count');
  await dialog.getByLabel('Cantidad contada').fill('0.123457');
  await expect(dialog.getByRole('status')).toContainText('0,123456 → 0,123457');
});

test('rejects unchanged counts and insufficient exits without writing', async ({ page }) => {
  const { adjustments } = await setup(page, 5);
  await page.goto('/inventory/stock');
  await page.getByRole('button', { name: 'Ajustar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tipo').selectOption('count');
  await dialog.getByLabel('Cantidad contada').fill('5');
  await dialog.getByLabel('Motivo', { exact: true }).fill('Conteo de control');
  await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  expect(adjustments).toHaveLength(0);
  await dialog.getByLabel('Tipo').selectOption('out');
  await dialog.getByLabel('Cantidad', { exact: true }).fill('6');
  await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
  await expect(dialog).toBeVisible();
  expect(adjustments).toHaveLength(0);
});

test('retains known balances after a failed refresh and recovers on retry', async ({ page }) => {
  await setup(page, 5);
  await page.goto('/inventory/stock');
  await expect(page.getByRole('cell', { name: '5 metro' })).toBeVisible();
  await page.route('**/api/v1/inventory/stock', route => route.fulfill({ status: 403, json: { message: 'Sin permiso' } }));
  await page.getByRole('button', { name: 'Recargar', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('cell', { name: '5 metro' })).toBeVisible();
  await page.unroute('**/api/v1/inventory/stock');
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.getByRole('cell', { name: '5 metro' })).toBeVisible();
});

test('keeps mobile entry usable and contains keyboard focus', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/inventory/stock');
  const trigger = page.getByRole('button', { name: 'Registrar existencia', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await dialog.getByRole('button', { name: 'Registrar ajuste' }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cerrar', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Registrar ajuste' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect(await dialog.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('stock-mobile-entry.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test('prevents dismissal while a stock write is pending', async ({ page }) => {
  await setup(page);
  let pending: Route | undefined;
  await page.route('**/adjust', route => { pending = route; });
  const dialog = await openInitial(page);
  await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
  await expect.poll(() => !!pending).toBe(true);
  await expect(dialog.getByRole('button', { name: 'Cerrar', exact: true })).toBeDisabled();
  await expect(dialog.getByLabel('Cantidad', { exact: true })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Guardando...' })).toHaveAttribute('aria-busy', 'true');
  await page.mouse.click(5, 5);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await pending!.fulfill({ json: { data: { quantity: 0.125 } } });
  await expect(dialog).toBeHidden();
});
