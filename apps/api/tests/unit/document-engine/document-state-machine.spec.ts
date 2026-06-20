import { DocumentStateMachine } from '../../../src/modules/document-engine/domain/document-state-machine';
import { DocumentStatus } from '../../../src/modules/document-engine/domain/document.entity';

describe('DocumentStateMachine', () => {
  let stateMachine: DocumentStateMachine;

  beforeEach(() => {
    stateMachine = new DocumentStateMachine();
  });

  it('should allow valid transitions', () => {
    expect(stateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.PENDING_APPROVAL)).toBe(true);
    expect(stateMachine.canTransition(DocumentStatus.PENDING_APPROVAL, DocumentStatus.APPROVED)).toBe(true);
    expect(stateMachine.canTransition(DocumentStatus.APPROVED, DocumentStatus.DELIVERED)).toBe(true);
    expect(stateMachine.canTransition(DocumentStatus.APPROVED, DocumentStatus.PAID)).toBe(true);
    expect(stateMachine.canTransition(DocumentStatus.APPROVED, DocumentStatus.CANCELLED)).toBe(true);
    expect(stateMachine.canTransition(DocumentStatus.DELIVERED, DocumentStatus.PAID)).toBe(true);
    expect(stateMachine.canTransition(DocumentStatus.PAID, DocumentStatus.CANCELLED)).toBe(true);
    expect(stateMachine.canTransition(DocumentStatus.PENDING_APPROVAL, DocumentStatus.DRAFT)).toBe(true);
    expect(stateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.CANCELLED)).toBe(true);
    expect(stateMachine.canTransition(DocumentStatus.PENDING_APPROVAL, DocumentStatus.CANCELLED)).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(stateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.DELIVERED)).toBe(false);
    expect(stateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.PAID)).toBe(false);
    expect(stateMachine.canTransition(DocumentStatus.DRAFT, DocumentStatus.APPROVED)).toBe(false);
  });

  it('should throw on invalid transition', () => {
    expect(() => {
      stateMachine.transition(DocumentStatus.DRAFT, DocumentStatus.DELIVERED);
    }).toThrow(/Invalid transition/);
  });

  it('should not throw on valid transition', () => {
    expect(() => {
      stateMachine.transition(DocumentStatus.DRAFT, DocumentStatus.PENDING_APPROVAL);
    }).not.toThrow();
  });

  it('should return valid next statuses', () => {
    const next = stateMachine.getValidNextStatuses(DocumentStatus.DRAFT);
    expect(next).toEqual([DocumentStatus.PENDING_APPROVAL, DocumentStatus.CANCELLED]);
  });

  it('should return action for a transition', () => {
    const action = stateMachine.getAction(DocumentStatus.DRAFT, DocumentStatus.PENDING_APPROVAL);
    expect(action).toBe('submit');
  });

  it('should return undefined for invalid transition action', () => {
    const action = stateMachine.getAction(DocumentStatus.DRAFT, DocumentStatus.APPROVED);
    expect(action).toBeUndefined();
  });

  it('should list all transitions', () => {
    const transitions = stateMachine.getTransitions();
    expect(transitions.length).toBe(10);
  });
});
