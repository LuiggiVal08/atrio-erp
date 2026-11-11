import type { Page } from '@playwright/test';

const MOCK_PRODUCTS = [
  { id: 'prod-1', name: 'Clavo 2" x 1/4', sku: 'CLV-001', barcode: '7791234567890', price: 150.00 },
  { id: 'prod-2', name: 'Tornillo Allen M8', sku: 'TRN-001', barcode: '7791234567891', price: 320.50 },
  { id: 'prod-3', name: 'Cable THHN #12', sku: 'CBL-001', barcode: '7791234567892', price: 9800.00 },
  { id: 'prod-4', name: 'Pintura Latex Blanco 4L', sku: 'PNT-001', barcode: '7791234567893', price: 12500.00 },
  { id: 'prod-5', name: 'Disco Corte 7"', sku: 'DSC-001', barcode: '7791234567894', price: 2250.00 },
];

const MOCK_CLIENTS = [
  { id: 'cli-1', name: 'Ferretería El Tornillo', taxId: 'J-12345678-9' },
  { id: 'cli-2', name: 'Constructora Delta CA', taxId: 'J-98765432-1' },
];

export async function setupMocks(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'atrio-auth',
      JSON.stringify({
        state: {
          token: 'test-token',
          user: {
            id: 'u-1',
            email: 'qa@atrio.test',
            name: 'María',
            locale: 'es',
            enabledModules: [],
            permissions: [],
            tenantId: 't-1',
          },
        },
        version: 0,
      }),
    );
    localStorage.setItem('x-tenant-id', 't-1');
  });

  return page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.includes('/cash-payments/registers')) {
      return route.fulfill({
        json: [
          {
            id: 'reg-1',
            name: 'Caja Principal',
            currency: 'VED',
            balance: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    if (url.pathname.includes('/pos/sessions')) {
      return route.fulfill({
        json: [
          {
            id: 'sess-1',
            cashRegisterId: 'reg-1',
            userId: 'u-1',
            openingBalance: 0,
            closingBalance: null,
            status: 'open',
            openedAt: new Date().toISOString(),
            closedAt: null,
          },
        ],
      });
    }

    if (url.pathname.includes('/inventory/products')) {
      const search = url.searchParams.get('search')?.toLowerCase() ?? '';

      if (!search) {
        return route.fulfill({ json: [] });
      }

      const results = MOCK_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.barcode.includes(search),
      );
      return route.fulfill({ json: { data: results } });
    }

    if (url.pathname.includes('/client-vendor/clients')) {
      const search = url.searchParams.get('search')?.toLowerCase() ?? '';

      if (!search) {
        return route.fulfill({ json: { data: [] } });
      }

      const results = MOCK_CLIENTS.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.taxId.toLowerCase().includes(search),
      );
      return route.fulfill({ json: { data: results } });
    }

    if (url.pathname.includes('/pos/quick-sale')) {
      return route.fulfill({
        json: { id: 'sale-001', total: 150.00, change: 0, documentId: 'DOC-001' },
      });
    }

    return route.fulfill({ json: {} });
  });
}

export async function openPOS(page: Page) {
  await page.goto('/pos');
  await page.getByPlaceholder('Buscar producto (F2)...').waitFor({ state: 'visible' });
}

export async function addProductToCart(page: Page, query: string) {
  await page.keyboard.press('F2');
  // Human-speed typing so the scanner engine does not treat the text as a barcode.
  await page.keyboard.type(query, { delay: 250 });
  await page.getByRole('search', { name: 'Buscar producto' }).locator('li').first().waitFor();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
}

export async function payExactAmount(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Procesar pago' });
  await dialog.waitFor();
  const totalLabel = await dialog.getByText(/^Total: \$/).innerText();
  // Heading is formatted es-VE (3.155,78) but number inputs need a plain decimal.
  const total = totalLabel.replace('Total: $', '').trim().replace(/\./g, '').replace(',', '.');
  await dialog.locator('input[type="number"]').fill(total);
  await page.keyboard.press('Enter');
}
