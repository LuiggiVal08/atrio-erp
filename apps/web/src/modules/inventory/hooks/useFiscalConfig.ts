import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useFiscalConfigStore } from '../store/fiscal-config-store';

export function useFiscalConfig() {
  const { setTaxRules } = useFiscalConfigStore();

  return useQuery({
    queryKey: ['fiscalConfig'],
    queryFn: async () => {
      const res = await api.get('/localization/config');
      const data = res.data;
      if (data.taxRules) setTaxRules(data.taxRules);
      return data;
    },
  });
}
