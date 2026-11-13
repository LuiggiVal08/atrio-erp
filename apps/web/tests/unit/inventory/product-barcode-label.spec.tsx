import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductBarcodeLabel } from '@/modules/inventory/components/ProductBarcodeLabel';

vi.mock('qrcode', () => ({ default: { toCanvas: vi.fn().mockResolvedValue(undefined) } }));

// jsdom has no canvas 2d context; JsBarcode uses it to measure text width
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
  font: '',
  measureText: (text: string) => ({ width: text.length * 10 }),
} as unknown as CanvasRenderingContext2D);

afterEach(cleanup);

const props = { name: 'Producto', price: 10, sku: 'SKU-001' };

function svgTexts(container: HTMLElement) {
  return Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent);
}

describe('ProductBarcodeLabel', () => {
  it('renders 13-digit codes as EAN-13 with split digit groups', () => {
    const { container } = render(<ProductBarcodeLabel {...props} barcode="2000000000015" />);
    const texts = svgTexts(container);
    expect(texts.length).toBeGreaterThan(1);
    expect(texts.join('')).toBe('2000000000015');
  });

  it('renders non-EAN codes as CODE128 with a single text', () => {
    const { container } = render(<ProductBarcodeLabel {...props} barcode="SKU-001" />);
    expect(svgTexts(container)).toEqual(['SKU-001']);
  });

  it('falls back to CODE128 when a 13-digit code has an invalid check digit', () => {
    const { container } = render(<ProductBarcodeLabel {...props} barcode="2000000000010" />);
    expect(svgTexts(container)).toEqual(['2000000000010']);
  });
});