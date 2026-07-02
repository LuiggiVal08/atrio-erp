import { DocumentStateMachine } from '../../src/modules/document-engine/domain/document-state-machine';
import { DocumentStatus } from '../../src/modules/document-engine/domain/document.entity';

describe('DocumentStateMachine', () => {
  let stateMachine: DocumentStateMachine;

  beforeEach(() => {
    stateMachine = new DocumentStateMachine();
  });

  it('should be defined', () => {
    expect(stateMachine).toBeDefined();
  });

  describe('canTransition', () => {
    it('should allow draft → pending_approval', () => {
      expect(stateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.PENDING_APPROVAL)).toBe(true);
    });

    it('should allow pending_approval → approved', () => {
      expect(stateMachine.canTransition(DocumentStatus.PENDING_APPROVAL, DocumentStatus.APPROVED)).toBe(true);
    });

    it('should allow pending_approval → draft (reject)', () => {
      expect(stateMachine.canTransition(DocumentStatus.PENDING_APPROVAL, DocumentStatus.DRAFT)).toBe(true);
    });

    it('should allow approved → delivered', () => {
      expect(stateMachine.canTransition(DocumentStatus.APPROVED, DocumentStatus.DELIVERED)).toBe(true);
    });

    it('should allow approved → paid', () => {
      expect(stateMachine.canTransition(DocumentStatus.APPROVED, DocumentStatus.PAID)).toBe(true);
    });

    it('should allow approved → cancelled', () => {
      expect(stateMachine.canTransition(DocumentStatus.APPROVED, DocumentStatus.CANCELLED)).toBe(true);
    });

    it('should allow delivered → paid', () => {
      expect(stateMachine.canTransition(DocumentStatus.DELIVERED, DocumentStatus.PAID)).toBe(true);
    });

    it('should allow paid → cancelled', () => {
      expect(stateMachine.canTransition(DocumentStatus.PAID, DocumentStatus.CANCELLED)).toBe(true);
    });

    it('should reject draft → delivered', () => {
      expect(stateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.DELIVERED)).toBe(false);
    });

    it('should reject draft → approved', () => {
      expect(stateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.APPROVED)).toBe(false);
    });
  });

  describe('transition', () => {
    it('should not throw for valid transition', () => {
      expect(() => {
        stateMachine.transition(DocumentStatus.DRAFT, DocumentStatus.PENDING_APPROVAL);
      }).not.toThrow();
    });

    it('should throw for invalid transition', () => {
      expect(() => {
        stateMachine.transition(DocumentStatus.DRAFT, DocumentStatus.DELIVERED);
      }).toThrow('Invalid transition: draft → delivered');
    });
  });

  describe('getValidNextStatuses', () => {
    it('should return valid next statuses for draft', () => {
      const next = stateMachine.getValidNextStatuses(DocumentStatus.DRAFT);
      expect(next).toEqual(expect.arrayContaining([DocumentStatus.PENDING_APPROVAL]));
    });

    it('should return valid next statuses for approved', () => {
      const next = stateMachine.getValidNextStatuses(DocumentStatus.APPROVED);
      expect(next).toContain(DocumentStatus.DELIVERED);
      expect(next).toContain(DocumentStatus.PAID);
      expect(next).toContain(DocumentStatus.CANCELLED);
    });
  });

  describe('getAction', () => {
    it('should return action for valid transition', () => {
      expect(stateMachine.getAction(DocumentStatus.DRAFT, DocumentStatus.PENDING_APPROVAL)).toBe('submit');
    });

    it('should return undefined for invalid transition', () => {
      expect(stateMachine.getAction(DocumentStatus.DRAFT, DocumentStatus.DELIVERED)).toBeUndefined();
    });
  });
});
