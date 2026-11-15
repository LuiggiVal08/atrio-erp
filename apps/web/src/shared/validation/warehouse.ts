import { z } from 'zod';

export const warehouseFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  code: z.string(),
  branchId: z.string(),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;
