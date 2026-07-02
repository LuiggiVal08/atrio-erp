import { Product } from '../../../src/modules/inventory/domain/product.entity';

describe('Product', () => {
  const now = new Date();

  it('should create a standard product', () => {
    const p = new Product(
      'prod-1', 'tenant-1', 'LAP-001', 'Laptop Pro', null,
      'cat-1', 1200, 800, null, false, true, now, now, null,
    );
    expect(p.sku).toBe('LAP-001');
    expect(p.isService).toBe(false);
    expect(p.isActive).toBe(true);
  });

  it('should create a service product', () => {
    const p = new Product(
      'prod-2', 'tenant-1', 'SVC-001', 'Consulting', null,
      null, 100, 0, null, true, true, now, now, null,
    );
    expect(p.isService).toBe(true);
    expect(p.unitPrice).toBe(100);
  });

  it('should support soft-delete', () => {
    const deletedAt = new Date();
    const p = new Product(
      'prod-3', 'tenant-1', 'OLD-001', 'Old Product', null,
      null, 50, 25, null, false, false, now, now, deletedAt,
    );
    expect(p.isActive).toBe(false);
    expect(p.deletedAt).toEqual(deletedAt);
  });
});
