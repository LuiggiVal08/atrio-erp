import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      documentId: string; identificationType?: string;
      legalName: string; firstName?: string; middleName?: string; lastName?: string; secondLastName?: string;
      taxId: string; email?: string; phone?: string; addressId?: string;
      address?: { country: string; state: string; city: string; addressLine: string; reference?: string };
      ownerIsPrimary?: boolean;
      commercialName?: string; website?: string; metadataNotes?: string;
      paymentTerms?: string; deliveryDays?: number; categoryTags?: string[]; categoryIds?: string[];
      contacts?: { fullName: string; position?: string; email?: string; phone?: string; mobile?: string; isPrimary?: boolean }[];
      contactFirstName?: string; contactMiddleName?: string; contactLastName?: string; contactSecondLastName?: string;
      contactIdentificationType?: string; contactIdentificationNumber?: string;
      contactEmail?: string; contactPhone?: string;
    }) => {
      const res = await api.post('/client-vendor/vendors', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}
