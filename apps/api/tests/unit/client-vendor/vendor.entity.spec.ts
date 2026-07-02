import { Vendor } from '../../../src/modules/client-vendor/domain/vendor.entity';

describe('Vendor', () => {
  const now = new Date();

  it('should create a vendor with all fields', () => {
    const v = new Vendor(
      'vendor-1', 'tenant-1', 'Supply Corp', 'J-11111111-0',
      'ventas@supply.com', '+582121234567', 'Zona Industrial',
      true, now, now, null,
    );
    expect(v.legalName).toBe('Supply Corp');
    expect(v.taxId).toBe('J-11111111-0');
    expect(v.isActive).toBe(true);
  });

  it('should support soft-delete', () => {
    const deletedAt = new Date();
    const v = new Vendor(
      'vendor-2', 'tenant-1', 'Old Vendor', 'J-22222222-0',
      null, null, null, false, now, now, deletedAt,
    );
    expect(v.isActive).toBe(false);
    expect(v.deletedAt).toEqual(deletedAt);
  });
});
