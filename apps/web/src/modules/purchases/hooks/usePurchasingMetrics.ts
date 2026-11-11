import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export type DeliveryTiming = 'EARLY' | 'ON_TIME' | 'LATE' | 'UNKNOWN';

export interface DeliveryMetricRow {
  vendorId: string;
  vendorName: string;
  orders: number;
  early: number;
  onTime: number;
  late: number;
  unknown: number;
  promisedDays: number | null;
  avgActualDays: number | null;
  avgDelayDays: number | null;
  avgEarlyDays: number | null;
  avgLateDays: number | null;
  totalSpend: number;
  lastReceivedAt: string | null;
  lastTiming: DeliveryTiming | null;
  pendingOrders: number;
  overdueOrders: number;
}

export interface SpendByCategoryRow {
  categoryId: string | null;
  categoryName: string;
  totalSpend: number;
  orders: number;
}

export interface VendorDeliveryOrderRow {
  id: string;
  documentId: string;
  status: string;
  expectedDate: string | null;
  receivedAt: string | null;
  createdAt: string;
  total: number;
  currency: string;
  delayDays: number | null;
  timing: DeliveryTiming;
}

export interface PendingDeliveryRow {
  id: string;
  documentId: string;
  vendorId: string;
  vendorName: string;
  status: string;
  expectedDate: string | null;
  daysUntilDue: number | null;
  total: number;
  currency: string;
}

interface DateRange {
  from?: string;
  to?: string;
}

export function useDeliveryMetrics(range?: DateRange) {
  return useQuery<DeliveryMetricRow[]>({
    queryKey: ['purchasing-metrics', 'delivery', range?.from ?? null, range?.to ?? null],
    queryFn: async () => {
      const res = await api.get('/purchasing/metrics/delivery', {
        params: { from: range?.from, to: range?.to },
      });
      return res.data ?? [];
    },
  });
}

export function useSpendByCategory(range?: DateRange) {
  return useQuery<SpendByCategoryRow[]>({
    queryKey: ['purchasing-metrics', 'spend-by-category', range?.from ?? null, range?.to ?? null],
    queryFn: async () => {
      const res = await api.get('/purchasing/metrics/spend-by-category', {
        params: { from: range?.from, to: range?.to },
      });
      return res.data ?? [];
    },
  });
}

export function useVendorDeliveryHistory(vendorId: string | null, range?: DateRange) {
  return useQuery<VendorDeliveryOrderRow[]>({
    queryKey: ['purchasing-metrics', 'vendor-delivery', vendorId, range?.from ?? null, range?.to ?? null],
    enabled: Boolean(vendorId),
    queryFn: async () => {
      const res = await api.get(`/purchasing/metrics/vendor-delivery/${vendorId}`, {
        params: { from: range?.from, to: range?.to },
      });
      return res.data ?? [];
    },
  });
}

export function usePendingDeliveries(range?: DateRange) {
  return useQuery<PendingDeliveryRow[]>({
    queryKey: ['purchasing-metrics', 'pending-deliveries', range?.from ?? null, range?.to ?? null],
    queryFn: async () => {
      const res = await api.get('/purchasing/metrics/pending-deliveries', {
        params: { from: range?.from, to: range?.to },
      });
      return res.data ?? [];
    },
  });
}
