import { ProductSnapshot } from '../../../src/modules/purchasing/domain/product-snapshot.vo';

describe('ProductSnapshot', () => {
  it('should create with valid data', () => {
    const p = new ProductSnapshot('p1', 'SKU-001', 'Widget', 'unidad', 'w1');
    expect(p.productId).toBe('p1');
    expect(p.sku).toBe('SKU-001');
    expect(p.name).toBe('Widget');
    expect(p.unit).toBe('unidad');
    expect(p.warehouseId).toBe('w1');
  });

  it('should throw if productId is empty', () => {
    expect(() => new ProductSnapshot('', 'SKU', 'Test', null, null)).toThrow('productId is required');
  });

  it('should throw if sku is empty', () => {
    expect(() => new ProductSnapshot('p1', '', 'Test', null, null)).toThrow('Product SKU is required');
  });

  it('should throw if name is empty', () => {
    expect(() => new ProductSnapshot('p1', 'SKU', '', null, null)).toThrow('Product name is required');
  });

  it('should allow optional fields as null', () => {
    const p = new ProductSnapshot('p1', 'SKU', 'Test', null, null);
    expect(p.unit).toBeNull();
    expect(p.warehouseId).toBeNull();
  });
});
