import { expect, test, type Page } from '@playwright/test';

const warehouses = [
  { id: 'w-main', tenantId: 't-1', name: 'Almacén Principal', branchId: 'b-1', code: 'ALM-PRI', isActive: true, createdAt: '' },
  { id: 'w-dispatch', tenantId: 't-1', name: 'Almacén de Despacho', branchId: 'b-1', code: 'ALM-DESP', isActive: true, createdAt: '' },
  { id: 'w-sales', tenantId: 't-1', name: 'Almacén de Sala de Ventas', branchId: 'b-2', code: 'ALM-VAL', isActive: true, createdAt: '' },
  { id: 'w-old', tenantId: 't-1', name: 'Depósito Histórico', branchId: null, code: null, isActive: false, createdAt: '' },
];
const branches = [
  { id: 'b-1', name: 'Sucursal Centro', code: 'CEN', address: null, phone: null, isActive: true, createdAt: '' },
  { id: 'b-2', name: 'Sucursal Este', code: 'EST', address: null, phone: null, isActive: true, createdAt: '' },
];
const summary = {
  warehouseId: 'w-main', skuCount: 128, totalUnits: 1842.375, totalValue: 24890.5, currency: 'USD',
  health: { healthy: 82, low: 24, out: 9, overstock: 13 },
  categories: [
    { categoryId: 'c-1', name: 'Herramientas', units: 640.125, value: 9800 },
    { categoryId: 'c-2', name: 'Tornillería', units: 520, value: 4100 },
  ],
};
const locations = [
  { id: 'l-a', tenantId: 't-1', warehouseId: 'w-main', parentId: null, type: 'AISLE', code: 'A', name: 'Pasillo principal', path: 'A', isActive: true, createdAt: '', updatedAt: '' },
  { id: 'l-a1', tenantId: 't-1', warehouseId: 'w-main', parentId: 'l-a', type: 'SHELF', code: '01', name: null, path: 'A/01', isActive: true, createdAt: '', updatedAt: '' },
  { id: 'l-a11', tenantId: 't-1', warehouseId: 'w-main', parentId: 'l-a1', type: 'LEVEL', code: '1', name: null, path: 'A/01/1', isActive: true, createdAt: '', updatedAt: '' },
  { id: 'l-a111', tenantId: 't-1', warehouseId: 'w-main', parentId: 'l-a11', type: 'BIN', code: '01', name: 'Bin tornillería', path: 'A/01/1/01', isActive: true, createdAt: '', updatedAt: '' },
];

async function setup(page: Page) {
  const rows = warehouses.map((warehouse) => ({ ...warehouse }));
  await page.addInitScript(() => {
    localStorage.setItem('atrio-auth', JSON.stringify({ state: { token: 'test-token', user: { id: 'u-1', email: 'qa@atrio.test', name: 'QA', locale: 'es', enabledModules: [], permissions: [], tenantId: 't-1' } }, version: 0 }));
    localStorage.setItem('atrio-tenant', JSON.stringify({ state: { activeTenantId: 't-1' }, version: 0 }));
    localStorage.setItem('x-tenant-id', 't-1');
  });
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
    if (path === '/auth/tenants' || path === '/localization/currency-rates') return route.fulfill({ json: [] });
    if (path === '/inventory/branches') return route.fulfill({ json: { data: branches } });
    if (route.request().method() === 'PATCH') {
      const row = rows.find((warehouse) => path === `/inventory/warehouses/${warehouse.id}`);
      if (row) Object.assign(row, route.request().postDataJSON());
      return route.fulfill({ json: { data: row ?? {} } });
    }
    if (path === '/inventory/warehouses/default') return route.fulfill({ json: { data: rows[0] } });
    if (path === '/inventory/warehouses') return route.fulfill({ json: { data: rows } });
    if (path === '/inventory/warehouses/w-main/summary') return route.fulfill({ json: { data: summary } });
    if (path === '/inventory/warehouses/w-main/locations') return route.fulfill({ json: { data: locations } });
    if (path === '/inventory/warehouses/w-main') return route.fulfill({ json: { data: rows[0] } });
    return route.fulfill({ json: { data: {} } });
  });
}

const layout = (page: Page) =>
  page.evaluate(() => {
    const box = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const strip = document.querySelector('.mb-4.grid.gap-px');
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      header: box(document.querySelector('h1')?.closest('div.flex.shrink-0') as Element | null),
      cells: strip ? Array.from(strip.children).map(box) : [],
    };
  });

test('warehouse list keeps hierarchy and compact header at desktop and mobile', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/inventory/warehouses');
  await expect(page.getByRole('heading', { name: 'Almacenes' })).toBeVisible();

  const desktop = await layout(page);
  expect(desktop.overflow).toBe(false);
  expect(desktop.cells).toHaveLength(4);
  expect(desktop.cells.every((cell) => cell && cell.y === desktop.cells[0]?.y)).toBe(true);

  await expect(page.getByText('Inactivo', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Reactivar', exact: true }).first().click();
  await page.waitForTimeout(200);
  expect(page.url()).toContain('/inventory/warehouses');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const mobile = await layout(page);
  expect(mobile.overflow).toBe(false);
  expect(mobile.header?.h ?? 0).toBeLessThan(160);
  expect(mobile.cells[2]?.y).toBeGreaterThan(mobile.cells[0]?.y ?? 0);
});

test('warehouse detail merges stock into general and toggles edit form without overflow', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/inventory/warehouses/w-main');
  await expect(page.getByRole('heading', { name: 'Almacén Principal' })).toBeVisible();

  const sections = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    hasForm: !!document.querySelector('form'),
    tabs: document.querySelectorAll('[role="tab"]').length,
  }));
  expect(sections).toEqual({ overflow: false, hasForm: false, tabs: 2 });

  await expect(page.getByText('Datos del almacén')).toBeVisible();
  await expect(page.getByText('Sucursal Centro')).toBeVisible();
  await expect(page.getByText('Salud del inventario')).toBeVisible();

  await page.getByRole('button', { name: 'Editar' }).click();
  const formState = await page.evaluate(() => {
    const form = document.querySelector('form');
    return {
      hasFormHeader: !!form?.closest('section')?.querySelector('div.border-b'),
      hasFormFooter: !!form?.querySelector('div.border-t'),
    };
  });
  expect(formState).toEqual({ hasFormHeader: true, hasFormFooter: true });
  await expect(page.getByLabel('Nombre')).toHaveValue('Almacén Principal');
  await expect(page.getByLabel('Código')).toHaveValue('ALM-PRI');
  await expect(page.getByLabel('Sucursal')).toHaveValue('b-1');
  await page.getByLabel('Nombre').fill('Nombre descartado');

  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByText('Datos del almacén')).toBeVisible();
  expect(await page.evaluate(() => !!document.querySelector('form'))).toBe(false);
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByLabel('Nombre')).toHaveValue('Almacén Principal');
  await expect(page.getByLabel('Código')).toHaveValue('ALM-PRI');
  await expect(page.getByLabel('Sucursal')).toHaveValue('b-1');
  await page.getByLabel('Nombre').fill('Almacén Principal Editado');
  const saved = page.waitForRequest((request) => request.method() === 'PATCH');
  await page.getByRole('button', { name: 'Guardar' }).click();
  expect((await saved).postDataJSON()).toEqual({ name: 'Almacén Principal Editado', code: 'ALM-PRI', branchId: 'b-1' });
  await expect(page.getByRole('heading', { name: 'Almacén Principal Editado' })).toBeVisible();
  await expect(page.getByText((1842.375).toLocaleString('es', { maximumFractionDigits: 20 }), { exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '640,125' })).toBeVisible();
  await expect(page.getByText(/no representa una cantidad física comparable/)).toBeVisible();
  const general = page.getByRole('tab', { name: 'General' });
  await general.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Ubicaciones' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Ubicaciones' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('tab', { name: 'Ubicaciones' }).click();
  await expect(page.getByText('Bin tornillería')).toBeVisible();

  await page.getByRole('button', { name: 'Contraer A', exact: true }).click();
  await expect(page.getByText('Bin tornillería')).toBeHidden();
  await page.getByRole('button', { name: 'Expandir A', exact: true }).click();
  await expect(page.getByText('Bin tornillería')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: 'General' }).click();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByLabel('Nombre')).toHaveValue('Almacén Principal Editado');
  await page.screenshot({ path: testInfo.outputPath('warehouse-mobile-edit.png'), fullPage: true });
  expect(errors).toEqual([]);
});
