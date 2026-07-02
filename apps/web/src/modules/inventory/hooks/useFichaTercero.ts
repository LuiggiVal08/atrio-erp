import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import type { FichaTercero } from '../components/CreditAlertBanner';

export function useFichaTercero(id: string) {
  return useQuery<FichaTercero>({
    queryKey: ['fichaTercero', id],
    queryFn: async () => {
      const res = await api.get(`/inventory/third-parties/${id}`);
      const data = res.data;
      return {
        ...data,
        creditExceeded: data.currentBalance > data.creditLimit,
      };
    },
    enabled: !!id,
  });
}
