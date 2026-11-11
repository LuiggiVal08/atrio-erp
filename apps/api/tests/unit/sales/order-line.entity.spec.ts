import { OrderLine } from '../../../src/modules/sales/domain/order-line.entity';
import { Money } from '../../../src/modules/sales/domain/money.vo';

describe('OrderLine', () => {
  const unitPrice = new Money(100, 'VED');

  it('should create a line with valid data', () => {
    const line = OrderLine.create({
      productId: 'prod-1',
      productName: 'Laptop',
      productSku: 'LAP001',
      quantity: 2,
      unitPrice,
    });
    expect(line.productId).toBe('prod-1');
    expect(line.productName).toBe('Laptop');
    expect(line.quantity).toBe(2);
    expect(line.unitPrice.amount).toBe(100);
    expect(line.lineTotal.amount).toBe(200);
    expect(line.lineNumber).toBe(1);
  });

  it('should reject quantity <= 0', () => {
    expect(() => new OrderLine('l1', 1, 'p1', 'Test', null, 0, unitPrice, new Money(0, 'VED'), new Date()))
      .toThrow('INV-SALE-003: Line quantity must be greater than zero');
    expect(() => new OrderLine('l1', 1, 'p1', 'Test', null, -1, unitPrice, new Money(0, 'VED'), new Date()))
      .toThrow('INV-SALE-003: Line quantity must be greater than zero');
  });

  it('should calculate lineTotal on create', () => {
    const line = OrderLine.create({ productId: 'p1', productName: 'Item', productSku: null, quantity: 3, unitPrice: new Money(50, 'VED') });
    expect(line.lineTotal.amount).toBe(150);
  });

  it('should update quantity and recalculate lineTotal', () => {
    const line = OrderLine.create({ productId: 'p1', productName: 'Item', productSku: null, quantity: 2, unitPrice: new Money(100, 'VED') });
    const updated = line.withQuantity(5);
    expect(updated.quantity).toBe(5);
    expect(updated.lineTotal.amount).toBe(500);
    expect(updated.id).toBe(line.id);
  });

  it('should preserve unitPrice on quantity change', () => {
    const line = OrderLine.create({ productId: 'p1', productName: 'Item', productSku: null, quantity: 1, unitPrice: new Money(100, 'VED') });
    const updated = line.withQuantity(3);
    expect(updated.unitPrice.amount).toBe(100);
  });

  it('should compare equality by id', () => {
    const a = new OrderLine('same-id', 1, 'p1', 'A', null, 1, unitPrice, new Money(100, 'VED'), new Date());
    const b = new OrderLine('same-id', 2, 'p2', 'B', null, 1, unitPrice, new Money(100, 'VED'), new Date());
    const c = new OrderLine('diff-id', 1, 'p1', 'A', null, 1, unitPrice, new Money(100, 'VED'), new Date());
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
