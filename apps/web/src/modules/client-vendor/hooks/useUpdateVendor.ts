import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface UpdateVendorContactInput {
  id?: string;
  fullName: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  identificationType?: string;
  identificationNumber?: string;
  isPrimary?: boolean;
}

export interface UpdateVendorInput {
  legalName?: string;
  documentId?: string;
  identificationType?: string;
  taxId?: string;
  commercialName?: string;
  website?: string;
  metadataNotes?: string;
  paymentTerms?: string;
  deliveryDays?: number;
  categoryIds?: string[];
  contacts?: UpdateVendorContactInput[];
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateVendorInput & { id: string }) => {
      const res = await api.patch(`/client-vendor/vendors/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['fichaTercero', 'vendor', variables.id] });
    },
  });
}
