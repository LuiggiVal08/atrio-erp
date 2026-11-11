import { GoodsReceipt } from '../../../src/modules/purchasing/domain/goods-receipt.entity';
import { GoodsReceiptLine } from '../../../src/modules/purchasing/domain/goods-receipt-line.entity';
import { PurchasingOrderLine } from '../../../src/modules/purchasing/domain/purchasing-order-line.entity';
import { ProductSnapshot } from '../../../src/modules/purchasing/domain/product-snapshot.vo';

function makeReceipt(overrides?: Partial<{ status: string }>): GoodsReceipt {
  const lines = [
    GoodsReceiptLine.create({
      purchasingOrderLineId: 'pol-1',
      receivedQuantity: 5,
      damagedQuantity: 0,
    }),
  ];
  return GoodsReceipt.fromPersistence({
    id: 'gr-1',
    purchasingOrderId: 'po-1',
    tenantId: 't1',
    status: (overrides?.status ?? 'PENDING') as any,
    receivedAt: new Date(),
    lines,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makePOLine(id?: string): PurchasingOrderLine {
  return PurchasingOrderLine.create({
    id,
    productSnapshot: new ProductSnapshot('p1', 'SKU-001', 'Widget', 'unidad', 'w1'),
    orderedQuantity: 10,
    unitCost: 100,
  });
}

describe('GoodsReceipt', () => {
  describe('create', () => {
    it('should create with PENDING status', () => {
      const receipt = GoodsReceipt.create({
        purchasingOrderId: 'po-1',
        tenantId: 't1',
        receivedAt: new Date(),
      });
      expect(receipt.status).toBe('PENDING');
      expect(receipt.lines).toHaveLength(0);
    });
  });

  describe('receive', () => {
    it('should transition from PENDING to RECEIVED', () => {
      const receipt = makeReceipt({ status: 'PENDING' });
      const received = receipt.receive();
      expect(received.status).toBe('RECEIVED');
    });

    it('should throw if already RECEIVED', () => {
      const receipt = makeReceipt({ status: 'RECEIVED' });
      expect(() => receipt.receive()).toThrow('Cannot transition');
    });
  });

  describe('buildUpdatedPOLines', () => {
    it('should update received quantities from matching receipt lines', () => {
      const poLine = makePOLine('pol-1');
      const receipt = makeReceipt();

      const updatedLines = receipt.buildUpdatedPOLines([poLine]);
      expect(updatedLines[0].receivedQuantity).toBe(5);
    });

    it('should keep line unchanged if no matching receipt line', () => {
      const poLine = makePOLine();
      const receipt = GoodsReceipt.create({
        purchasingOrderId: 'po-1',
        tenantId: 't1',
        receivedAt: new Date(),
      });

      const updatedLines = receipt.buildUpdatedPOLines([poLine]);
      expect(updatedLines[0].receivedQuantity).toBe(0);
    });
  });
});
