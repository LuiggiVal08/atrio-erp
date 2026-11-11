import { useMutation } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface PaymentAllocationInput {
  method: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  bankName?: string;
  reference?: string;
  details?: string;
}

export interface CheckoutInput {
  cashRegisterId: string;
  customerId: string | null;
  allocations: PaymentAllocationInput[];
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    warehouseId: string;
  }>;
}

export interface CheckoutResult {
  id: string;
  change: number;
  total: number;
  documentId: string;
}

export function usePosCheckout() {
  return useMutation({
    mutationFn: async (input: CheckoutInput) => {
      const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const taxAmount = subtotal * 0.16;
      const total = subtotal + taxAmount;
      const amountReceived = input.allocations.reduce(
        (sum, allocation) => sum + allocation.amount * allocation.exchangeRate,
        0,
      );

      const res = await api.post('/pos/quick-sale', {
        clientId: input.customerId ?? undefined,
        cashRegisterId: input.cashRegisterId,
        subtotal,
        taxAmount,
        total,
        currency: 'VED',
        paymentMethod: input.allocations[0]?.method ?? 'cash',
        paymentAllocations: input.allocations,
        items: input.items,
      });
      const serverChange = Number(res.data?.change);
      return {
        id: res.data?.orderId ?? crypto.randomUUID(),
        change: Number.isFinite(serverChange)
          ? serverChange
          : Math.max(0, amountReceived - total),
        total,
        documentId: res.data?.documentId ?? '',
      } satisfies CheckoutResult;
    },
  });
}
