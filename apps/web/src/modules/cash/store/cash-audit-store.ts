import { create } from 'zustand';
import type { DocumentStatus } from '@/core/components/DocumentStateBadge';

export interface CashAudit {
  id: string;
  cashRegisterId: string;
  cashierId: string;
  openedAt: string;
  closedAt: string | null;
  status: DocumentStatus;
  expectedCash: number;
  expectedCard: number;
  expectedTransfer: number;
  countedCash: number | null;
  countedCard: number | null;
  countedTransfer: number | null;
  difference: number | null;
  isBalanced: boolean | null;
}

export interface ExpectedAmounts {
  cash: number;
  card: number;
  transfer: number;
}

export interface CountedAmounts {
  cash: number;
  card: number;
  transfer: number;
}

interface CashAuditState {
  audit: CashAudit | null;
  isAuditing: boolean;
  startAudit: (registerId: string, expected: ExpectedAmounts) => void;
  setCounted: (counted: CountedAmounts) => void;
  approve: () => void;
  reject: () => void;
  reset: () => void;
}

export const useCashAuditStore = create<CashAuditState>((set) => ({
  audit: null,
  isAuditing: false,

  startAudit: (registerId, expected) =>
    set({
      audit: {
        id: `audit-${Date.now()}`,
        cashRegisterId: registerId,
        cashierId: 'current-user',
        openedAt: new Date().toISOString(),
        closedAt: null,
        status: 'draft',
        expectedCash: expected.cash,
        expectedCard: expected.card,
        expectedTransfer: expected.transfer,
        countedCash: null,
        countedCard: null,
        countedTransfer: null,
        difference: null,
        isBalanced: null,
      },
      isAuditing: true,
    }),

  setCounted: (counted) =>
    set((s) => {
      if (!s.audit) return s;
      const diff =
        counted.cash - s.audit.expectedCash +
        counted.card - s.audit.expectedCard +
        counted.transfer - s.audit.expectedTransfer;
      return {
        audit: {
          ...s.audit,
          countedCash: counted.cash,
          countedCard: counted.card,
          countedTransfer: counted.transfer,
          difference: diff,
          isBalanced: diff === 0,
        },
      };
    }),

  approve: () =>
    set((s) => {
      if (!s.audit) return s;
      return {
        audit: { ...s.audit, status: 'closed' as DocumentStatus, closedAt: new Date().toISOString() },
        isAuditing: false,
      };
    }),

  reject: () =>
    set({
      audit: null,
      isAuditing: false,
    }),

  reset: () => set({ audit: null, isAuditing: false }),
}));
