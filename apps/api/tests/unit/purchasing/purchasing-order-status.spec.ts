import { purchasingOrderStateMachine } from '../../../src/modules/purchasing/domain/purchasing-order-status';

describe('PurchasingOrderStatus', () => {
  describe('canTransition', () => {
    it('should allow DRAFT to APPROVED', () => {
      expect(purchasingOrderStateMachine.canTransition('DRAFT', 'APPROVED')).toBe(true);
    });

    it('should allow APPROVED to RECEIVING', () => {
      expect(purchasingOrderStateMachine.canTransition('APPROVED', 'RECEIVING')).toBe(true);
    });

    it('should allow RECEIVING to COMPLETED', () => {
      expect(purchasingOrderStateMachine.canTransition('RECEIVING', 'COMPLETED')).toBe(true);
    });

    it('should disallow DRAFT to RECEIVING', () => {
      expect(purchasingOrderStateMachine.canTransition('DRAFT', 'RECEIVING')).toBe(false);
    });

    it('should disallow COMPLETED to anything', () => {
      expect(purchasingOrderStateMachine.canTransition('COMPLETED', 'DRAFT')).toBe(false);
    });

    it('should disallow self transitions', () => {
      expect(purchasingOrderStateMachine.canTransition('DRAFT', 'DRAFT')).toBe(false);
    });
  });

  describe('assertValidTransition', () => {
    it('should not throw for valid transition', () => {
      expect(() => purchasingOrderStateMachine.assertValidTransition('DRAFT', 'APPROVED')).not.toThrow();
    });

    it('should throw for invalid transition', () => {
      expect(() => purchasingOrderStateMachine.assertValidTransition('DRAFT', 'COMPLETED'))
        .toThrow('Cannot transition');
    });
  });

  describe('getValidTransitions', () => {
    it('should return [APPROVED] for DRAFT', () => {
      expect(purchasingOrderStateMachine.getValidTransitions('DRAFT')).toEqual(['APPROVED']);
    });

    it('should return [] for COMPLETED', () => {
      expect(purchasingOrderStateMachine.getValidTransitions('COMPLETED')).toEqual([]);
    });
  });
});
