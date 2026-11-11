import { GoodsReceiptLine } from '../../../src/modules/purchasing/domain/goods-receipt-line.entity';

describe('GoodsReceiptLine', () => {
  describe('create', () => {
    it('should create with valid data', () => {
      const line = GoodsReceiptLine.create({
        purchasingOrderLineId: 'pol-1',
        receivedQuantity: 10,
        damagedQuantity: 1,
        notes: 'Una caja dañada',
      });
      expect(line.receivedQuantity).toBe(10);
      expect(line.damagedQuantity).toBe(1);
      expect(line.notes).toBe('Una caja dañada');
    });

    it('should default damagedQuantity to 0', () => {
      const line = GoodsReceiptLine.create({
        purchasingOrderLineId: 'pol-1',
        receivedQuantity: 10,
      });
      expect(line.damagedQuantity).toBe(0);
      expect(line.notes).toBeNull();
    });

    it('should throw if receivedQuantity <= 0', () => {
      expect(() => GoodsReceiptLine.create({
        purchasingOrderLineId: 'pol-1',
        receivedQuantity: 0,
      })).toThrow('INV-GR-001');
    });

    it('should throw if damagedQuantity < 0', () => {
      expect(() => GoodsReceiptLine.create({
        purchasingOrderLineId: 'pol-1',
        receivedQuantity: 10,
        damagedQuantity: -1,
      })).toThrow('INV-GR-002');
    });
  });
});
