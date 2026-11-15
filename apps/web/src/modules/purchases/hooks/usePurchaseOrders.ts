import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface PurchaseOrderLine {
  lineId: string;
  description: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  receivedQuantity: number | null;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  documentId: string;
  vendorId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: string;
  notes?: string;
  expectedDate?: string;
  receivedAt?: string;
  createdAt: string;
  lines?: PurchaseOrderLine[];
}

export interface ReceivePurchaseOrderInput {
  id: string;
  operationId: string;
  lines: Array<{ lineId: string; productId: string; warehouseId: string; quantity: number }>;
}

export interface CreatePurchaseOrderInput {
  vendorId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency?: string;
  notes?: string;
  expectedDate?: string;
}

export interface UpdatePurchaseOrderInput {
  vendorId?: string;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  currency?: string;
  notes?: string;
  expectedDate?: string;
  status?: string;
}

export function usePurchaseOrders() {
  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/purchasing/orders');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery<PurchaseOrder>({
    queryKey: ['purchase-orders', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/purchasing/orders/${id}`);
      return res.data?.data || res.data;
    },
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePurchaseOrderInput) => {
      const res = await api.post('/purchasing/orders', {
        ...input,
        currency: input.currency ?? 'VED',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdatePurchaseOrderInput) => {
      const res = await api.patch(`/purchasing/orders/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.id] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/purchasing/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/purchasing/orders/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, operationId, lines }: ReceivePurchaseOrderInput) => {
      const res = await api.patch(`/purchasing/orders/${id}/receive`, { operationId, lines });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
      queryClient.invalidateQueries({ queryKey: ['reorder-points'] });
    },
  });
}

export function useCompleteReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/purchasing/orders/${id}/receive/complete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/purchasing/orders/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}
