import { goodsReceiptStateMachine } from '../../../src/modules/purchasing/domain/goods-receipt-status';

describe('GoodsReceiptStatus', () => {
  describe('canTransition', () => {
    it('should allow PENDING to RECEIVED', () => {
      expect(goodsReceiptStateMachine.canTransition('PENDING', 'RECEIVED')).toBe(true);
    });

    it('should disallow RECEIVED to anything', () => {
      expect(goodsReceiptStateMachine.canTransition('RECEIVED', 'PENDING')).toBe(false);
    });
  });

  describe('assertValidTransition', () => {
    it('should not throw for PENDING to RECEIVED', () => {
      expect(() => goodsReceiptStateMachine.assertValidTransition('PENDING', 'RECEIVED')).not.toThrow();
    });

    it('should throw for RECEIVED to PENDING', () => {
      expect(() => goodsReceiptStateMachine.assertValidTransition('RECEIVED', 'PENDING'))
        .toThrow('Cannot transition');
    });
  });
});
