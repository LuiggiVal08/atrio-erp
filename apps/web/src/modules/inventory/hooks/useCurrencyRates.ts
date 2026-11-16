import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

export interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
  source: 'manual' | 'sync' | string;
  provider: string | null;
}

export function useCurrencyRates(from?: string, to?: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return useQuery({
    queryKey: ['currency-rates', from, to, tenantId],
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

export function useSyncCurrencyRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; providerIds?: string[] }) => {
      const res = await api.post('/localization/currency-rates/sync', data);
      return res.data as {
        provider: string;
        fromCurrency: string;
        toCurrency: string;
        rate: number;
        date: string;
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['currency-rates'] }),
  });
}
