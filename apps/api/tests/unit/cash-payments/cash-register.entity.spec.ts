import { CashRegister } from '../../../src/modules/cash-payments/domain/cash-register.entity';

describe('CashRegister', () => {
  const now = new Date();

  it('should create with initial balance', () => {
    const reg = new CashRegister(
      'reg-1', 'tenant-1', 'Caja Principal', 0, 'USD', true, now, now,
    );
    expect(reg.name).toBe('Caja Principal');
    expect(reg.balance).toBe(0);
    expect(reg.currency).toBe('USD');
  });

  it('should create with positive balance', () => {
    const reg = new CashRegister(
      'reg-2', 'tenant-1', 'Caja USD', 1000, 'USD', true, now, now,
    );
    expect(reg.balance).toBe(1000);
  });
});
