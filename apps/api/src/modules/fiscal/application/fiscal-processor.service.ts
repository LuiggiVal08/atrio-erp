import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { FiscalService } from '../domain/fiscal.service';
import type { FiscalInvoiceData, ContributorType } from '@atrio/core-accounting';

@Injectable()
export class FiscalProcessorService {
  private readonly logger = new Logger(FiscalProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fiscalService: FiscalService,
  ) {}

  async processInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        document: true,
        client: true,
      },
    });

    if (!invoice) {
      this.logger.warn(`Factura ${invoiceId} no encontrada`);
      return;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: invoice.tenantId },
    });

    if (!tenant) {
      this.logger.warn(`Tenant ${invoice.tenantId} no encontrado`);
      return;
    }

    const countryCode = tenant.country || 'VE';

    if (!this.fiscalService.hasStrategy(countryCode)) {
      this.logger.log(`No hay estrategia fiscal para ${countryCode}, omitiendo`);
      return;
    }

    const strategy = this.fiscalService.getStrategy(countryCode);

    const fiscalData: FiscalInvoiceData = {
      id: invoice.id,
      documentNumber: invoice.document.documentNumber,
      clientId: invoice.clientId,
      clientName: invoice.client.legalName,
      clientTaxId: invoice.client.taxId,
      clientContributorType: (invoice.client as any).contributorType as ContributorType | undefined,
      lines: [],
      subtotal: invoice.subtotal,
      currency: invoice.currency,
      exchangeRate: invoice.currencyRate ?? undefined,
      countryCode,
      createdAt: invoice.createdAt,
    };

    const taxResult = strategy.calculateTaxes(fiscalData);
    const withholdingResult = strategy.applyWithholdings(fiscalData);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.salesInvoice.update({
        where: { id: invoiceId },
        data: {
          fiscalStatus: 'pending',
          fiscalSentAt: new Date(),
        },
      });

      for (const detail of [...taxResult.lines, ...withholdingResult.withholdings]) {
        await tx.invoiceTaxDetail.create({
          data: {
            tenantId: invoice.tenantId,
            invoiceId: invoice.id,
            taxType: detail.taxType,
            baseImponible: detail.baseImponible,
            percentage: detail.percentage,
            amount: detail.amount,
            isWithholding: detail.isWithholding,
          },
        });
      }
    });

    this.logger.log(`Factura ${invoice.document.documentNumber}: impuestos calculados (${taxResult.totalTax}), retenciones (${withholdingResult.totalWithholding})`);
  }

  async submitToFiscalEntity(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        document: true,
        client: true,
        taxDetails: true,
      },
    });

    if (!invoice) {
      this.logger.warn(`Factura ${invoiceId} no encontrada`);
      return;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: invoice.tenantId },
    });

    if (!tenant) return;

    const strategy = this.fiscalService.getStrategy(tenant.country || 'VE');

    const fiscalData: FiscalInvoiceData = {
      id: invoice.id,
      documentNumber: invoice.document.documentNumber,
      clientId: invoice.clientId,
      clientName: invoice.client.legalName,
      clientTaxId: invoice.client.taxId,
      clientContributorType: (invoice.client as any).contributorType as ContributorType | undefined,
      lines: [],
      subtotal: invoice.subtotal,
      currency: invoice.currency,
      exchangeRate: invoice.currencyRate ?? undefined,
      countryCode: tenant.country || 'VE',
      createdAt: invoice.createdAt,
    };

    const result = await strategy.registerFiscalDocument(fiscalData);

    await this.prisma.salesInvoice.update({
      where: { id: invoiceId },
      data: {
        fiscalStatus: result.success ? 'posted' : 'pending',
        fiscalNumber: result.fiscalNumber,
        cufe: result.cufe,
        qrUrl: result.qrUrl,
        fiscalError: result.error,
        fiscalPostedAt: result.success ? new Date() : undefined,
        status: result.success ? 'posted' : 'pending_fiscal',
      },
    });

    if (result.success) {
      this.logger.log(`Factura ${invoice.document.documentNumber} emitida fiscalmente. #Fiscal: ${result.fiscalNumber}`);
    } else {
      this.logger.warn(`Factura ${invoice.document.documentNumber} rechazada: ${result.error}`);
    }
  }

  async getFiscalDetails(invoiceId: string): Promise<Record<string, unknown>> {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: { taxDetails: true, document: true },
    });

    if (!invoice) return { error: 'Factura no encontrada' };

    return {
      id: invoice.id,
      documentNumber: invoice.document.documentNumber,
      fiscalStatus: invoice.fiscalStatus,
      fiscalNumber: invoice.fiscalNumber,
      cufe: invoice.cufe,
      qrUrl: invoice.qrUrl,
      fiscalError: invoice.fiscalError,
      fiscalSentAt: invoice.fiscalSentAt,
      fiscalPostedAt: invoice.fiscalPostedAt,
      taxDetails: invoice.taxDetails,
    };
  }
}
