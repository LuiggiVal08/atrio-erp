import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

export type ThirdPartyKind = 'client' | 'vendor';

export interface ThirdPartyContact {
  id: string;
  fullName: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  mobile?: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  isPrimary: boolean;
}

export interface ThirdPartyAddress {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
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
  address?: ThirdPartyAddress | null;
  createdAt?: string;
}

export function useFichaTercero(id: string, kind: ThirdPartyKind) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<ThirdPartyDetail>({
    queryKey: ['fichaTercero', kind, id, tenantId],
    queryFn: async () => {
      const resource = kind === 'vendor' ? 'vendors' : 'clients';
      const res = await api.get(`/client-vendor/${resource}/${id}`);
      return { ...res.data, kind };
    },
    enabled: !!id,
  });
}
