import { z } from 'zod';

export const printableBarcode = /^[\x20-\x7E]*$/;
const stockLimit = z.number().min(0).optional();

export const productFormSchema = z.object({
  sku: z.string().trim().min(1, 'El SKU es obligatorio'),
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  barcode: z.string().trim().regex(printableBarcode, 'Use caracteres ASCII imprimibles para CODE128'),
  description: z.string(),
  categoryId: z.string(),
  brandId: z.string(),
  taxId: z.string(),
  unitPrice: z.number().min(0, 'El precio debe ser cero o positivo'),
  costPrice: z.number().min(0, 'El costo debe ser cero o positivo'),
  isService: z.boolean(),
  isActive: z.boolean(),
  baseUnit: z.string().trim().min(1, 'La unidad base es obligatoria'),
  purchaseUnit: z.string(),
  conversionFactor: z.number().min(0.000001, 'La conversión debe ser mayor que cero'),
  minStock: stockLimit,
  maxStock: stockLimit,
  reorderPoint: stockLimit,
  primarySupplierId: z.union([z.literal(''), z.uuid()]),
  supplierSku: z.string(),
}).superRefine((value, ctx) => {
  if (value.maxStock !== undefined && value.maxStock < (value.minStock ?? 0)) {
    ctx.addIssue({ code: 'custom', path: ['maxStock'], message: 'El máximo no puede ser menor que el mínimo' });
  }
  if (value.maxStock !== undefined && value.maxStock < (value.reorderPoint ?? 0)) {
    ctx.addIssue({ code: 'custom', path: ['reorderPoint'], message: 'La reposición no puede superar el máximo' });
  }
});

export type ProductFormValues = z.input<typeof productFormSchema>;
export const productDefaults: ProductFormValues = {
  sku: '', name: '', barcode: '', description: '', categoryId: '', brandId: '', taxId: '',
  unitPrice: 0, costPrice: 0, isService: false, isActive: true, baseUnit: 'unidad',
  purchaseUnit: '', conversionFactor: 1, minStock: 0, maxStock: undefined, reorderPoint: 0,
  primarySupplierId: '', supplierSku: '',
};

export function productPayload(value: ProductFormValues, editing = false, original?: { costPrice?: number | string }) {
  const parsed = productFormSchema.parse(value);
  const optional = (text: string) => text.trim() || (editing ? null : undefined);
  return {
    sku: parsed.sku, name: parsed.name, barcode: optional(parsed.barcode),
    description: optional(parsed.description), categoryId: optional(parsed.categoryId),
    brandId: optional(parsed.brandId), taxId: optional(parsed.taxId), unitPrice: parsed.unitPrice,
    ...(!editing || parsed.costPrice !== Number(original?.costPrice) ? { costPrice: parsed.costPrice } : {}),
    isService: parsed.isService, ...(editing ? { isActive: parsed.isActive } : {}),
    baseUnit: parsed.baseUnit, purchaseUnit: optional(parsed.purchaseUnit),
    conversionFactor: parsed.conversionFactor, minStock: parsed.minStock ?? 0,
    maxStock: parsed.maxStock ?? (editing ? null : undefined), reorderPoint: parsed.reorderPoint ?? 0,
    primarySupplierId: optional(parsed.primarySupplierId), supplierSku: optional(parsed.supplierSku),
  };
}
