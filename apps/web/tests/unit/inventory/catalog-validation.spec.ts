import { describe, expect, it } from 'vitest';
import { productFormSchema, productDefaults, productPayload } from '@/shared/validation/product';
import { brandFormSchema } from '@/shared/validation/brand';

const valid = { ...productDefaults, sku: ' SKU-1 ', name: ' Producto ', unitPrice: 12, costPrice: 5 };

describe('catalog form contract', () => {
  it('clears nonnullable stock limits to zero and nullable maximum to null', () => {
    const value = { ...valid, minStock: undefined, reorderPoint: undefined, maxStock: undefined };
    expect(productFormSchema.safeParse(value).success).toBe(true);
    expect(productPayload(value, true)).toMatchObject({ minStock: 0, reorderPoint: 0, maxStock: null });
  });
  it.each([0, -1, NaN, Infinity, undefined])('rejects conversion factor %s without substituting one', (conversionFactor) => {
    expect(productFormSchema.safeParse({ ...valid, conversionFactor }).success).toBe(false);
  });
  it('rejects inverted limits and negative prices', () => {
    expect(productFormSchema.safeParse({ ...valid, minStock: 5, maxStock: 4 }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...valid, costPrice: -1 }).success).toBe(false);
  });
  it.each(['código', 'ABC\n123', '产品'])('rejects unsafe CODE128 input %s', (barcode) => {
    expect(productFormSchema.safeParse({ ...valid, barcode }).success).toBe(false);
  });
  it('accepts printable ASCII and manually typed EAN fallback', () => {
    expect(productFormSchema.safeParse({ ...valid, barcode: 'SKU-001' }).success).toBe(true);
    expect(productFormSchema.safeParse({ ...valid, barcode: '2000000000010' }).success).toBe(true);
  });
  it('validates tenant supplier identifiers as UUIDs', () => {
    expect(productFormSchema.safeParse({ ...valid, primarySupplierId: 'wrong' }).success).toBe(false);
  });
  it('trims identity and omits unchanged cost in an edit', () => {
    const payload = productPayload(valid, true, { costPrice: 5 });
    expect(payload.sku).toBe('SKU-1');
    expect(payload).not.toHaveProperty('costPrice');
    expect(productPayload(valid, true, { costPrice: 6 }).costPrice).toBe(5);
  });
  it('validates nonempty brand names', () => {
    expect(brandFormSchema.safeParse({ name: '  ' }).success).toBe(false);
    expect(brandFormSchema.parse({ name: ' Bosch ' }).name).toBe('Bosch');
  });
});
