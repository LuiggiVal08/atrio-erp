import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      sku: string; barcode?: string; name: string; description?: string;
      categoryId?: string; brandId?: string; unitPrice: number; costPrice: number;
      taxId?: string; isService: boolean;
      baseUnit?: string; purchaseUnit?: string; conversionFactor?: number;
      minStock?: number; maxStock?: number; reorderPoint?: number;
      supplierSku?: string;
    }) => {
      const res = await api.post('/inventory/products', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
