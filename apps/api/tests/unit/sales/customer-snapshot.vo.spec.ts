import { CustomerSnapshot } from '../../../src/modules/sales/domain/customer-snapshot.vo';

describe('CustomerSnapshot', () => {
  it('should create with required fields', () => {
    const cs = new CustomerSnapshot('p1', 'Juan Pérez', 'J-12345678-9', 'Av Principal 123', 'juan@example.com', '04121234567');
    expect(cs.partnerId).toBe('p1');
    expect(cs.name).toBe('Juan Pérez');
    expect(cs.taxId).toBe('J-12345678-9');
    expect(cs.address).toBe('Av Principal 123');
    expect(cs.email).toBe('juan@example.com');
    expect(cs.phone).toBe('04121234567');
  });

  it('should reject empty partnerId', () => {
    expect(() => new CustomerSnapshot('', 'Test', null, null, null, null)).toThrow('partnerId is required');
  });

  it('should reject empty name', () => {
    expect(() => new CustomerSnapshot('p1', '', null, null, null, null)).toThrow('Customer name is required');
  });

  it('should allow null optional fields', () => {
    const cs = new CustomerSnapshot('p1', 'Test', null, null, null, null);
    expect(cs.taxId).toBeNull();
    expect(cs.address).toBeNull();
    expect(cs.email).toBeNull();
    expect(cs.phone).toBeNull();
  });

  it('should create updated snapshot with partial data', () => {
    const cs = new CustomerSnapshot('p1', 'Old Name', 'J-123', 'Old Address', 'old@email.com', '0412');
    const updated = cs.update({ name: 'New Name', email: 'new@email.com' });
    expect(updated.name).toBe('New Name');
    expect(updated.taxId).toBe('J-123');
    expect(updated.address).toBe('Old Address');
    expect(updated.email).toBe('new@email.com');
    expect(updated.phone).toBe('0412');
    expect(updated.partnerId).toBe('p1');
  });

  it('should not mutate original snapshot on update', () => {
    const cs = new CustomerSnapshot('p1', 'Original', null, null, null, null);
    cs.update({ name: 'Changed' });
    expect(cs.name).toBe('Original');
  });
});
