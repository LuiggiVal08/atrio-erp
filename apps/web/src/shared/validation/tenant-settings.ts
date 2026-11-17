import { z } from 'zod';

const optionalNonNegative = (message: string) =>
  z
    .union([z.number(), z.undefined()])
    .refine((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0, { message });

const optionalPositive = (message: string) =>
  z
    .union([z.number(), z.undefined()])
    .refine((value) => typeof value === 'number' && Number.isFinite(value) && value > 0, { message });

const optionalPercentage = z
  .union([z.number(), z.undefined()])
  .refine(
    (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100,
    { message: 'El porcentaje debe estar entre 0 y 100.' },
  );

export const companySettingsSchema = z.object({
  legalName: z.string().trim().min(1, 'La razón social es obligatoria'),
  taxId: z.string(),
  baseCurrency: z.string().min(1, 'Selecciona la moneda base'),
  timezone: z.string().min(1, 'Selecciona la zona horaria'),
});

export const generalSettingsSchema = z.object({
  language: z.string().min(1),
  stockThreshold: optionalNonNegative('El umbral de stock no puede ser negativo.'),
  lowStockAlerts: z.boolean(),
  stockAlertEmail: z.boolean(),
  stockAlertRecipients: z.string(),
});

export const inventorySettingsSchema = z.object({
  defaultCostMethod: z.string().min(1),
  allowNegativeStock: z.boolean(),
});

export const salesSettingsSchema = z.object({
  defaultDocType: z.string().min(1),
  receiptFooter: z.string(),
  enableCommissions: z.boolean(),
  defaultPaymentTerms: z.string().min(1),
  autoInvoiceNumbering: z.boolean(),
});

export const fiscalSettingsSchema = z.object({
  defaultVatRate: optionalPercentage,
  autoWithholding: z.boolean(),
  defaultContributorType: z.string().min(1),
});

export const financialSettingsSchema = z.object({
  foreignCurrency: z.string().min(1),
  multicurrency: z.boolean(),
  exchangeRateSource: z.string().min(1),
  exchangeRateProviders: z.string().min(1),
});

export const systemSettingsSchema = z.object({
  sessionTimeout: optionalPositive('El tiempo de sesión debe ser mayor que cero.'),
  enableAudit: z.boolean(),
});

export type CompanySettingsValues = z.infer<typeof companySettingsSchema>;
export type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
export type InventorySettingsValues = z.infer<typeof inventorySettingsSchema>;
export type SalesSettingsValues = z.infer<typeof salesSettingsSchema>;
export type FiscalSettingsValues = z.infer<typeof fiscalSettingsSchema>;
export type FinancialSettingsValues = z.infer<typeof financialSettingsSchema>;
export type SystemSettingsValues = z.infer<typeof systemSettingsSchema>;
