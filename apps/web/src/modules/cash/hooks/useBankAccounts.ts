import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  isActive: boolean;
}

export function useBankAccounts() {
  return useQuery<BankAccount[]>({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await api.get('/cash-payments/bank-accounts');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}
