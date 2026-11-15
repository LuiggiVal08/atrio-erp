import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface UpdateVendorContactInput {
  id?: string;
  fullName: string;
  position?: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  isPrimary?: boolean;
}

export interface UpdateVendorInput {
  legalName?: string;
  documentId?: string;
  identificationType?: string;
  taxId?: string;
  email?: string | null;
  phone?: string | null;
  commercialName?: string;
  website?: string;
  metadataNotes?: string;
  paymentTerms?: string;
  deliveryDays?: number;
  categoryIds?: string[];
  address?: { country: string; state: string; city: string; addressLine: string; reference?: string } | null;
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
