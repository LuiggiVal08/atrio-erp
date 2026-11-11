import type { FiscalRegistryResult } from '@atrio/core-accounting';

/** Interfaz para el Agente Fiscal Local (impresora fiscal USB/Serial) */
export interface FiscalAgent {
  printInvoice(data: FiscalPrintData): Promise<FiscalRegistryResult>;
  getStatus(): Promise<FiscalAgentStatus>;
}

export interface FiscalPrintData {
  documentNumber: string;
  clientName: string;
  clientTaxId: string;
  clientAddress?: string;
  lines: FiscalPrintLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
}

export interface FiscalPrintLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface FiscalAgentStatus {
  connected: boolean;
  printerModel?: string;
  serialNumber?: string;
  lastPrintAt?: Date;
  error?: string;
}
