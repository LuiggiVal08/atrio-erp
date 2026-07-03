import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface CashRegister {
  id: string;
  name: string;
  currency: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export function useCashRegisters() {
  return useQuery<CashRegister[]>({
    queryKey: ['cash-registers'],
    queryFn: async () => {
      const res = await api.get('/cash-payments/registers');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}
