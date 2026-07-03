import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
}

export function useCurrencyRates(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return useQuery({
    queryKey: ['currency-rates', from, to],
    queryFn: async () => {
      const res = await api.get(`/localization/currency-rates${qs ? `?${qs}` : ''}`);
      return res.data as CurrencyRate[];
    },
  });
}

export function useCreateCurrencyRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; rate: number; date: string }) => {
      const res = await api.post('/localization/currency-rates', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['currency-rates'] }),
  });
}
