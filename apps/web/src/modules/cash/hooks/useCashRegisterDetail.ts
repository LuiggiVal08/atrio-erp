import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { listQueryOptions } from '@/core/lib/query-defaults';

export interface CashRegisterDetail {
  register: { id: string; name: string; location: string; currency: string; balance: number; isActive: boolean };
  session: null | {
    id: string;
    status: string;
    openedAt: string;
    openingBalance: number;
    closingBalance: number | null;
    user: null | { id: string; name: string; email: string };
  };
  previousClosing: null | {
    closedAt: string | null;
    closingDenominations: Record<string, Record<string, number>>;
  };
  totals: {
    openingBalance: number;
    cashPayments: number;
    cashOut: number;
    expectedCash: number;
    currentBalance: number;
    payments: Array<{ method: string; currency: string; amount: number }>;
    cashByCurrency: Array<{ currency: string; amount: number }>;
    cashPaymentsByCurrency: Array<{ currency: string; amount: number }>;
    cashOutByCurrency: Array<{ currency: string; amount: number }>;
  };
  movements: Array<{
    id: string;
    type: 'in' | 'out';
    amount: number;
    currency: string;
    exchangeRate: number;
    baseAmount: number;
    paymentMethod: string;
    description: string | null;
    category?: string | null;
    receiptName?: string | null;
    createdAt: string;
  }>;
}

export function useCashRegisterDetail(registerId: string | null) {
  return useQuery<CashRegisterDetail>({
    queryKey: ['cash-register-detail', registerId],
    queryFn: async () => {
      const res = await api.get(`/cash-payments/registers/${registerId}/detail`);
      return res.data?.data || res.data;
    },
    enabled: !!registerId,
    refetchInterval: 10_000,
    ...listQueryOptions(),
  });
}
