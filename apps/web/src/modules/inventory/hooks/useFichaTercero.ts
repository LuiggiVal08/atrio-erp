import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export type ThirdPartyKind = 'client' | 'vendor';

export interface ThirdPartyContact {
  id: string;
  fullName: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
}

export interface ThirdPartyDetail {
  id: string;
  kind: ThirdPartyKind;
  legalName: string;
  documentId?: string | null;
  identificationType?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  commercialName?: string | null;
  website?: string | null;
  paymentTerms?: string | null;
  deliveryDays?: number | null;
  metadataNotes?: string | null;
  isActive?: boolean;
  categories?: { id: string; name: string }[];
  contacts?: ThirdPartyContact[];
  createdAt?: string;
}

export function useFichaTercero(id: string, kind: ThirdPartyKind) {
  return useQuery<ThirdPartyDetail>({
    queryKey: ['fichaTercero', kind, id],
    queryFn: async () => {
      const resource = kind === 'vendor' ? 'vendors' : 'clients';
      const res = await api.get(`/client-vendor/${resource}/${id}`);
      return { ...res.data, kind };
    },
    enabled: !!id,
  });
}
