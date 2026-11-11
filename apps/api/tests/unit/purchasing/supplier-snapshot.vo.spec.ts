import { SupplierSnapshot } from '../../../src/modules/purchasing/domain/supplier-snapshot.vo';

describe('SupplierSnapshot', () => {
  it('should create with valid data', () => {
    const s = new SupplierSnapshot('s1', 'Proveedor ABC', 'J-123', 'a@b.com', '555');
    expect(s.supplierId).toBe('s1');
    expect(s.name).toBe('Proveedor ABC');
    expect(s.taxId).toBe('J-123');
  });

  it('should throw if supplierId is empty', () => {
    expect(() => new SupplierSnapshot('', 'Test', null, null, null)).toThrow('supplierId is required');
  });

  it('should throw if name is empty', () => {
    expect(() => new SupplierSnapshot('s1', '', null, null, null)).toThrow('Supplier name is required');
  });

  it('should allow optional fields as null', () => {
    const s = new SupplierSnapshot('s1', 'Test', null, null, null);
    expect(s.taxId).toBeNull();
    expect(s.email).toBeNull();
    expect(s.phone).toBeNull();
  });
});
