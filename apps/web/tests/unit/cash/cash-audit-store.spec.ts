import { describe, it, expect, beforeEach } from 'vitest';
import { useCashAuditStore } from '@/modules/cash/store/cash-audit-store';

describe('cash audit store', () => {
  beforeEach(() => {
    const state = useCashAuditStore.getState();
    state.reset();
  });

  it('starts with no active audit', () => {
    const state = useCashAuditStore.getState();
    expect(state.audit).toBeNull();
    expect(state.isAuditing).toBe(false);
  });

  it('starts an audit', () => {
    useCashAuditStore.getState().startAudit('reg-1', { cash: 500, card: 300, transfer: 200 });
    const state = useCashAuditStore.getState();
    expect(state.audit).not.toBeNull();
    expect(state.isAuditing).toBe(true);
    expect(state.audit?.cashRegisterId).toBe('reg-1');
    expect(state.audit?.expectedCash).toBe(500);
  });

  it('sets counted amounts', () => {
    useCashAuditStore.getState().startAudit('reg-1', { cash: 500, card: 300, transfer: 200 });
    useCashAuditStore.getState().setCounted({ cash: 500, card: 300, transfer: 200 });
    const state = useCashAuditStore.getState();
    expect(state.audit?.countedCash).toBe(500);
    expect(state.audit?.countedCard).toBe(300);
  });

  it('calculates difference as zero when balanced', () => {
    useCashAuditStore.getState().startAudit('reg-1', { cash: 500, card: 300, transfer: 200 });
    useCashAuditStore.getState().setCounted({ cash: 500, card: 300, transfer: 200 });
    expect(useCashAuditStore.getState().audit?.difference).toBe(0);
    expect(useCashAuditStore.getState().audit?.isBalanced).toBe(true);
  });

  it('calculates difference correctly when unbalanced', () => {
    useCashAuditStore.getState().startAudit('reg-1', { cash: 500, card: 300, transfer: 200 });
    useCashAuditStore.getState().setCounted({ cash: 480, card: 300, transfer: 200 });
    expect(useCashAuditStore.getState().audit?.difference).toBe(-20);
    expect(useCashAuditStore.getState().audit?.isBalanced).toBe(false);
  });

  it('approves an audit and closes it', () => {
    useCashAuditStore.getState().startAudit('reg-1', { cash: 500, card: 300, transfer: 200 });
    useCashAuditStore.getState().setCounted({ cash: 500, card: 300, transfer: 200 });
    useCashAuditStore.getState().approve();
    const state = useCashAuditStore.getState();
    expect(state.isAuditing).toBe(false);
    expect(state.audit?.status).toBe('closed');
  });

  it('rejects an audit', () => {
    useCashAuditStore.getState().startAudit('reg-1', { cash: 500, card: 300, transfer: 200 });
    useCashAuditStore.getState().reject();
    const state = useCashAuditStore.getState();
    expect(state.isAuditing).toBe(false);
    expect(state.audit).toBeNull();
  });
});
