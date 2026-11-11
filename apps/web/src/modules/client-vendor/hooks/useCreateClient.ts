import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      documentId: string; identificationType?: string;
      legalName: string; firstName?: string; middleName?: string; lastName?: string; secondLastName?: string;
      taxId: string; email?: string; phone?: string; addressId?: string; contributorType?: string;
    }) => {
      const res = await api.post('/client-vendor/clients', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
