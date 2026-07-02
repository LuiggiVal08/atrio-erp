import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

interface SalesInvoice {
  id: string;
  documentId: string;
  salesOrderId?: string;
  clientId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: string;
  notes?: string;
  createdAt: string;
}

interface CreateInvoiceInput {
  clientId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency?: string;
  notes?: string;
  salesOrderId?: string;
}

export function useSalesInvoices() {
  return useQuery<SalesInvoice[]>({
    queryKey: ['sales-invoices'],
    queryFn: async () => {
      const res = await api.get('/sales/invoices');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useCreateSalesInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const res = await api.post('/sales/invoices', {
        documentId: crypto.randomUUID(),
        ...input,
        currency: input.currency ?? 'VED',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
    },
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/sales/invoices/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
    },
  });
}

export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paymentMethodId }: { id: string; paymentMethodId: string }) => {
      const res = await api.patch(`/sales/invoices/${id}/pay`, { paymentMethodId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
    },
  });
}
