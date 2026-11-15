import { expect, test, type Page } from '@playwright/test';

const branches = [
  {
    id: 'b-1',
    tenantId: 't-1',
    name: 'Sucursal Centro',
    code: 'CEN',
    address: 'Av. Principal 100',
    city: 'Caracas',
    state: 'Distrito Capital',
    phone: '+58 212 555 0100',
    managerEmployeeId: 'e-1',
    isActive: true,
    createdAt: '',
  },
  {
    id: 'b-2',
    tenantId: 't-1',
    name: 'Sucursal Este',
    code: 'EST',
    address: null,
    city: 'Valencia',
    state: 'Carabobo',
    phone: null,
    managerEmployeeId: null,
    isActive: false,
    createdAt: '',
  },
];
const warehouses = [
  { id: 'w-main', tenantId: 't-1', name: 'Almacén Principal', branchId: 'b-1', code: 'ALM-PRI', isActive: true, createdAt: '' },
  { id: 'w-dispatch', tenantId: 't-1', name: 'Almacén de Despacho', branchId: 'b-1', code: 'ALM-DESP', isActive: true, createdAt: '' },
  { id: 'w-old', tenantId: 't-1', name: 'Depósito Histórico', branchId: 'b-2', code: null, isActive: false, createdAt: '' },
];
const employees = [
  { id: 'e-1', firstName: 'Ana', middleName: null, lastName: 'Pérez', secondLastName: null, status: 'ACTIVE', deletedAt: null },
];

async function setup(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('atrio-auth', JSON.stringify({ state: { token: 'test-token', user: { id: 'u-1', email: 'qa@atrio.test', name: 'QA', locale: 'es', enabledModules: [], permissions: [], tenantId: 't-1' } }, version: 0 }));
    localStorage.setItem('atrio-tenant', JSON.stringify({ state: { activeTenantId: 't-1' }, version: 0 }));
    localStorage.setItem('x-tenant-id', 't-1');
  });
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
    if (path === '/auth/tenants' || path === '/localization/currency-rates') return route.fulfill({ json: [] });
    if (path === '/tenants/t-1/employees') return route.fulfill({ json: { data: employees } });
    if (path === '/inventory/branches') return route.fulfill({ json: { data: branches } });
    if (path === '/inventory/branches/b-1') return route.fulfill({ json: { data: branches[0] } });
    if (path === '/inventory/branches/b-2') return route.fulfill({ json: { data: branches[1] } });
    if (path === '/inventory/warehouses') return route.fulfill({ json: { data: warehouses } });
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

test('branch list keeps hierarchy and compact header at desktop and mobile', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/inventory/branches');
  await expect(page.getByRole('heading', { name: 'Sucursales' })).toBeVisible();
  await expect(page.getByText('Ana Pérez').first()).toBeVisible();

  const desktop = await layout(page);
  expect(desktop.overflow).toBe(false);
  expect(desktop.cells).toHaveLength(4);
  expect(desktop.cells.every((cell) => cell && cell.y === desktop.cells[0]?.y)).toBe(true);

  await expect(page.getByRole('button', { name: 'Desactivar' }).first()).toBeDisabled();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const mobile = await layout(page);
  expect(mobile.overflow).toBe(false);
  expect(mobile.header?.h ?? 0).toBeLessThan(160);
  expect(mobile.cells[2]?.y).toBeGreaterThan(mobile.cells[0]?.y ?? 0);
});

test('branch detail shows read-only text and warehouses together, edit opens a modal', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/inventory/branches/b-1');
  await expect(page.getByRole('heading', { name: 'Sucursal Centro' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Desactivar' })).toBeDisabled();

  const sections = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    forms: document.querySelectorAll('form').length,
    tabs: document.querySelectorAll('[role="tab"]').length,
    detailValues: document.querySelectorAll('dl dd').length,
  }));
  expect(sections).toEqual({ overflow: false, forms: 0, tabs: 0, detailValues: 7 });

  await expect(page.getByText('Detalles de la sucursal')).toBeVisible();
  await expect(page.getByText('Av. Principal 100')).toBeVisible();
  await expect(page.getByText('Ana Pérez')).toBeVisible();
  await expect(page.getByText('Almacén Principal')).toBeVisible();
  await expect(page.getByText('Depósito Histórico')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Nuevo almacén/ })).toHaveAttribute(
    'href',
    '/inventory/warehouses?branch=b-1',
  );

  await page.getByRole('button', { name: 'Editar' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Nombre', { exact: true })).toHaveValue('Sucursal Centro');
  await dialog.getByLabel('Nombre', { exact: true }).fill('Sucursal Centro Editada');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);
});

test('branch detail deep link scrolls to the warehouses section', async ({ page }) => {
  await setup(page);
  await page.goto('/inventory/branches/b-1?tab=warehouses');
  await expect(page.getByText('Almacenes de la sucursal')).toBeVisible();
  await expect(page.getByText('Almacén de Despacho')).toBeVisible();
});
