import { PurchasingOrderLine } from '../../../src/modules/purchasing/domain/purchasing-order-line.entity';
import { ProductSnapshot } from '../../../src/modules/purchasing/domain/product-snapshot.vo';

function makeProduct(): ProductSnapshot {
  return new ProductSnapshot('p1', 'SKU-001', 'Widget', 'unidad', 'w1');
}

describe('PurchasingOrderLine', () => {
  describe('create', () => {
    it('should compute totalCost with tax and discount', () => {
      const line = PurchasingOrderLine.create({
        productSnapshot: makeProduct(),
        orderedQuantity: 10,
        unitCost: 100,
        taxRate: 0.16,
        discountRate: 0.10,
      });
      // 100 * 10 * (1 - 0.10) * (1 + 0.16) = 1000 * 0.9 * 1.16 = 1044
      expect(line.totalCost).toBe(1044);
      expect(line.receivedQuantity).toBe(0);
    });

    it('should default taxRate and discountRate to 0', () => {
      const line = PurchasingOrderLine.create({
        productSnapshot: makeProduct(),
        orderedQuantity: 5,
        unitCost: 50,
      });
      expect(line.totalCost).toBe(250);
      expect(line.taxRate).toBe(0);
      expect(line.discountRate).toBe(0);
    });

    it('should throw if orderedQuantity <= 0', () => {
      expect(() => PurchasingOrderLine.create({
        productSnapshot: makeProduct(),
        orderedQuantity: 0,
        unitCost: 100,
      })).toThrow('INV-PO-001');
    });

    it('should throw if unitCost <= 0', () => {
      expect(() => PurchasingOrderLine.create({
        productSnapshot: makeProduct(),
        orderedQuantity: 10,
        unitCost: 0,
      })).toThrow('INV-PO-002');
    });
  });

  describe('withReceivedQuantity', () => {
    it('should update receivedQuantity', () => {
      const line = PurchasingOrderLine.create({
        productSnapshot: makeProduct(),
        orderedQuantity: 10,
        unitCost: 100,
      });
      const updated = line.withReceivedQuantity(7);
      expect(updated.receivedQuantity).toBe(7);
      expect(updated.orderedQuantity).toBe(10);
    });

    it('should throw if exceeds orderedQuantity', () => {
      const line = PurchasingOrderLine.create({
        productSnapshot: makeProduct(),
        orderedQuantity: 10,
        unitCost: 100,
      });
      expect(() => line.withReceivedQuantity(11)).toThrow('INV-PO-004');
    });
  });
});
