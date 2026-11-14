import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; sku?: string; barcode?: string | null; name?: string; description?: string | null; categoryId?: string | null; brandId?: string | null; unitPrice?: number; costPrice?: number; taxId?: string | null; isService?: boolean; isActive?: boolean; imageUrl?: string; baseUnit?: string | null; purchaseUnit?: string | null; conversionFactor?: number; minStock?: number | null; maxStock?: number | null; reorderPoint?: number | null; supplierSku?: string | null }) => {
      const res = await api.patch(`/inventory/products/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.id] });
    },
  });
}
