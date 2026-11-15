import { test, expect, type Page } from '@playwright/test';

const orderId = 'c85f0ae8-c107-4dbc-86ab-f2194e1dce9f';
const productId = '5a6dbdad-3b13-4705-95ea-f4a488043d94';
const warehouseId = '9e24ba35-e4ae-4f0b-aef2-96b462d00d6a';
const l1 = 'c53eb6e4-6c2b-45ce-9486-d6313eca19f2';
const l2 = '5bc7c6b9-6bde-49e6-91fa-783caa935bbe';

async function setup(page: Page, mode: 'success' | 'validation' | 'uncertain' = 'success', status = 'approved') {
  const requests: any[] = [];
  const operations = new Set<string>();
  let order = { id: orderId, documentId: 'PO-0001', vendorId: 'v1', status, subtotal: 55, taxAmount: 0, total: 55, currency: 'USD', createdAt: '2026-11-01T12:00:00Z',
    lines: [
      { lineId: l1, description: 'Tubo PVC', productId, warehouseId, quantity: 5, receivedQuantity: 0, unitPrice: 3 },
      { lineId: l2, description: 'Conector PVC', productId, warehouseId, quantity: 4, receivedQuantity: 0, unitPrice: 10 },
    ] };
  await page.addInitScript(() => {
    localStorage.setItem('atrio-auth', JSON.stringify({ state: { token: 'test-token', user: { id: 'u1', locale: 'es', name: 'QA', permissions: [], enabledModules: [], tenantId: 't1' } }, version: 0 }));
    localStorage.setItem('atrio-tenant', JSON.stringify({ state: { activeTenantId: 't1' }, version: 0 }));
    localStorage.setItem('x-tenant-id', 't1');
  });
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
    if (path === `/purchasing/orders/${orderId}/receive`) {
      const body = route.request().postDataJSON(); requests.push(body);
      if (mode === 'validation' && requests.length === 1) return route.fulfill({ status: 400, json: { message: 'Cantidad no disponible', errors: [{ field: 'lines[0].quantity', message: 'Cantidad no disponible' }] } });
      if (!operations.has(body.operationId)) {
        operations.add(body.operationId);
        order = { ...order, lines: order.lines.map(line => ({ ...line, receivedQuantity: line.receivedQuantity + (body.lines.find((l: any) => l.lineId === line.lineId)?.quantity ?? 0) })) };
        order.status = order.lines.every(l => l.quantity === l.receivedQuantity) ? 'received' : 'partial';
      }
      if (mode === 'uncertain' && requests.length === 1) return route.fulfill({ status: 503, json: { message: 'Response lost after commit' } });
      return route.fulfill({ json: { data: order } });
    }
    if (path === `/purchasing/orders/${orderId}`) return route.fulfill({ json: { data: order } });
    if (path === '/inventory/warehouses') return route.fulfill({ json: { data: [{ id: warehouseId, name: 'Principal', isActive: true }] } });
    if (path === '/inventory/products') return route.fulfill({ json: { data: [{ id: productId, name: 'Tubo PVC', sku: 'PVC-1' }] } });
    if (path === '/auth/tenants' || path === '/localization/currency-rates') return route.fulfill({ json: [] });
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto(`/purchasing/orders/${orderId}`);
  return { requests, order: () => order };
}

test('golden: receive actual quantities with currency separate from units', async ({ page }, info) => {
  const h = await setup(page);
  await page.getByRole('button', { name: 'Recibir', exact: true }).click();
  await page.getByLabel('Cantidad recibida · Tubo PVC').fill('5');
  await page.getByLabel('Cantidad recibida · Conector PVC').fill('4');
  await expect(page.getByText('USD', { exact: false }).first()).toBeVisible();
  await page.screenshot({ path: info.outputPath('receipt-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: info.outputPath('receipt-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Confirmar recepción' }).click();
  await expect.poll(() => h.requests.length).toBe(1);
  expect(h.requests[0].lines).toEqual([
    { lineId: l1, productId, warehouseId, quantity: 5 },
    { lineId: l2, productId, warehouseId, quantity: 4 },
  ]);
  expect(h.requests[0].operationId).toMatch(/^[0-9a-f-]{36}$/);
  await expect(page.getByRole('button', { name: 'Recibir', exact: true })).toHaveCount(0);
});

test('partial and omitted: receive 3 then 2, without receiving the second line', async ({ page }) => {
  const h = await setup(page);
  await page.getByRole('button', { name: 'Recibir', exact: true }).click();
  await page.getByLabel('Cantidad recibida · Tubo PVC').fill('3');
  await page.getByRole('button', { name: 'Confirmar recepción' }).click();
  await expect.poll(() => h.requests.length).toBe(1);
  await page.getByRole('button', { name: 'Recibir', exact: true }).click();
  await page.getByLabel('Cantidad recibida · Tubo PVC').fill('2');
  await page.getByRole('button', { name: 'Confirmar recepción' }).click();
  await expect.poll(() => h.requests.length).toBe(2);
  expect(h.requests.map(r => r.lines.map((l: any) => l.quantity))).toEqual([[3], [2]]);
  expect(h.requests[0].operationId).not.toBe(h.requests[1].operationId);
  expect(h.order().lines[1].receivedQuantity).toBe(0);
});

test('validation error keeps edits, permits correction, and sends a new batch ID', async ({ page }) => {
  const h = await setup(page, 'validation');
  await page.getByRole('button', { name: 'Recibir', exact: true }).click();
  const qty = page.getByLabel('Cantidad recibida · Tubo PVC');
  await qty.fill('3');
  await page.getByRole('button', { name: 'Confirmar recepción' }).click();
  await expect(page.getByText('Cantidad no disponible')).toBeVisible();
  await expect(qty).toHaveValue('3');
  await expect(qty).toBeEnabled();
  await qty.fill('2');
  await page.getByRole('button', { name: 'Confirmar recepción' }).click();
  await expect.poll(() => h.requests.length).toBe(2);
  expect(h.requests[1].lines[0].quantity).toBe(2);
  expect(h.requests[0].operationId).not.toBe(h.requests[1].operationId);
});

test('uncertain error retries the exact saved batch once, even across reload', async ({ page }) => {
  const h = await setup(page, 'uncertain');
  await page.getByRole('button', { name: 'Recibir', exact: true }).click();
  const qty = page.getByLabel('Cantidad recibida · Tubo PVC');
  await qty.fill('3');
  await page.getByRole('button', { name: 'Confirmar recepción' }).click();
  await expect(page.getByRole('button', { name: 'Reintentar recepción' })).toBeVisible();
  await expect(qty).toHaveValue('3');
  await expect(qty).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reintentar recepción' })).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar recepción' }).click();
  await expect.poll(() => h.requests.length).toBe(2);
  expect(h.requests[1]).toEqual(h.requests[0]);
  expect(h.order().lines[0].receivedQuantity).toBe(3);
});

test('empty, excess and overprecision cannot send a receipt', async ({ page }) => {
  const h = await setup(page);
  await page.getByRole('button', { name: 'Recibir', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar recepción' }).click();
  expect(h.requests).toHaveLength(0);
  const qty = page.getByLabel('Cantidad recibida · Tubo PVC');
  for (const value of ['6', '0.00001', '-1']) {
    await qty.fill(value);
    await page.getByRole('button', { name: 'Confirmar recepción' }).click();
    expect(h.requests).toHaveLength(0);
  }
});
