import { SalesOrderStatus, salesOrderStateMachine, isValidStatus, compareStatus } from '../../../src/modules/sales/domain/sales-order-status';

describe('SalesOrderStatus', () => {
  describe('canTransition', () => {
    it('should allow DRAFT to PENDING_PAYMENT', () => {
      expect(salesOrderStateMachine.canTransition(SalesOrderStatus.DRAFT, SalesOrderStatus.PENDING_PAYMENT)).toBe(true);
    });

    it('should disallow PENDING_PAYMENT to anything', () => {
      expect(salesOrderStateMachine.canTransition(SalesOrderStatus.PENDING_PAYMENT, SalesOrderStatus.DRAFT)).toBe(false);
    });

    it('should disallow invalid transitions', () => {
      expect(salesOrderStateMachine.canTransition(SalesOrderStatus.DRAFT, SalesOrderStatus.DRAFT)).toBe(false);
    });
  });

  describe('assertValidTransition', () => {
    it('should not throw for valid transition', () => {
      expect(() => salesOrderStateMachine.assertValidTransition(SalesOrderStatus.DRAFT, SalesOrderStatus.PENDING_PAYMENT)).not.toThrow();
    });

    it('should throw for invalid transition', () => {
      expect(() => salesOrderStateMachine.assertValidTransition(SalesOrderStatus.PENDING_PAYMENT, SalesOrderStatus.DRAFT))
        .toThrow('Cannot transition');
    });
  });

  describe('isValidStatus', () => {
    it('should validate known statuses', () => {
      expect(isValidStatus('draft')).toBe(true);
      expect(isValidStatus('pending_payment')).toBe(true);
    });

    it('should reject unknown statuses', () => {
      expect(isValidStatus('approved')).toBe(false);
      expect(isValidStatus('rejected')).toBe(false);
      expect(isValidStatus('')).toBe(false);
    });
  });

  describe('compareStatus', () => {
    it('should order DRAFT before PENDING_PAYMENT', () => {
      expect(compareStatus(SalesOrderStatus.DRAFT, SalesOrderStatus.PENDING_PAYMENT)).toBeLessThan(0);
    });

    it('should return 0 for same status', () => {
      expect(compareStatus(SalesOrderStatus.DRAFT, SalesOrderStatus.DRAFT)).toBe(0);
    });
  });
});
