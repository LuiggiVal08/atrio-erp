import { Client } from '../../../src/modules/client-vendor/domain/client.entity';

describe('Client', () => {
  const now = new Date();

  it('should create a client with all fields', () => {
    const c = new Client(
      'client-1', 'tenant-1', 'Acme Corp', 'J-12345678-0',
      'info@acme.com', '+584141234567', 'Av. Principal',
      true, now, now, null,
    );
    expect(c.legalName).toBe('Acme Corp');
    expect(c.taxId).toBe('J-12345678-0');
    expect(c.isActive).toBe(true);
  });

  it('should support soft-delete', () => {
    const deletedAt = new Date();
    const c = new Client(
      'client-2', 'tenant-1', 'Old Client', 'J-87654321-0',
      null, null, null, false, now, now, deletedAt,
    );
    expect(c.isActive).toBe(false);
    expect(c.deletedAt).toEqual(deletedAt);
  });
});
