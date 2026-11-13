import { chromium } from 'playwright';

const API = 'http://localhost:3000/api/v1';
const WEB = 'http://localhost:5173';

const login = await (await fetch(`${API}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@demo.com', password: 'TempPass123!', tenant: 'demo' }),
})).json();
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${login.accessToken}` };

const product = await (await fetch(`${API}/inventory/products`, {
  method: 'POST', headers,
  body: JSON.stringify({ sku: `EAN13-UI-${Date.now()}`, name: 'Prueba etiqueta EAN13', unitPrice: 12.5, costPrice: 6, isService: false }),
})).json();
if (!/^200\d{10}$/.test(product.barcode ?? '')) throw new Error(`unexpected barcode: ${product.barcode}`);
console.log(`product created: ${product.id} barcode=${product.barcode}`);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 200)); });
  await page.goto(`${WEB}/login`);
  await page.fill('#tenant', 'demo');
  await page.waitForSelector('button[type=submit]:not([disabled])');
  await page.click('button[type=submit]');
  await page.waitForSelector('#email');
  await page.fill('#email', 'admin@demo.com');
  await page.fill('#password', 'TempPass123!');
  await page.click('button[type=submit]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 });
  console.log('UI login OK');

  await page.goto(`${WEB}/inventory/${product.id}`);
  const svg = page.locator(`svg[aria-label="Código de barras ${product.barcode}"]`);
  try {
    await svg.waitFor({ state: 'visible', timeout: 15000 });
  } catch (err) {
    console.log('URL:', page.url());
    console.log('BODY:', (await page.locator('body').innerText()).slice(0, 600));
    await page.screenshot({ path: '/tmp/ean13-debug.png', fullPage: true });
    throw err;
  }

  const texts = await svg.locator('text').allTextContents();
  if (texts.length < 2 || texts.join('') !== product.barcode) {
    throw new Error(`label not rendered as EAN-13 groups: ${JSON.stringify(texts)}`);
  }
  console.log(`OK EAN-13 label rendered with digit groups: ${JSON.stringify(texts)}`);

  const generateButton = page.getByRole('button', { name: 'Generar código interno' });
  if (await generateButton.count()) throw new Error('generate button visible despite having barcode');
  console.log('OK generate button hidden (barcode already present)');

  const labelCard = page.locator('.print-label').first();
  await labelCard.screenshot({ path: '/tmp/ean13-label.png' });
  console.log('screenshot: /tmp/ean13-label.png');
} finally {
  await browser.close();
  await fetch(`${API}/inventory/products/${product.id}`, { method: 'DELETE', headers });
  console.log('cleanup: test product soft-deleted');
}
console.log('BROWSER VERIFICATION PASSED');