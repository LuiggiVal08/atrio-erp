import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CashMovementService } from './cash-movement.service';

@Injectable()
export class CashMovementEventHandler {
  constructor(private readonly cashMovementService: CashMovementService) {}

  @OnEvent('document.paid')
  async handleDocumentPaid(payload: {
    eventType: string;
    tenantId: string;
    documentId: string;
    documentType: string;
    triggeredBy: string;
    metadata?: any;
  }) {
    const registerId = payload.metadata?.cashRegisterId;
    const amount = payload.metadata?.amount;
    if (!registerId || !amount) return;

    await this.cashMovementService.register({
      tenantId: payload.tenantId,
      cashRegisterId: registerId,
      type: 'in',
      amount,
      referenceType: payload.documentType,
      referenceId: payload.documentId,
      description: `Payment for ${payload.documentType} ${payload.documentId}`,
      userId: payload.triggeredBy,
    });
  }

  @OnEvent('document.returned')
  async handleDocumentReturned(payload: {
    eventType: string;
    tenantId: string;
    documentId: string;
    documentType: string;
    triggeredBy: string;
    metadata?: any;
  }) {
    if (payload.documentType !== 'sales_return') return;
    if (payload.metadata?.resolution !== 'refund_cash') return;
    const registerId = payload.metadata?.cashRegisterId;
    const amount = payload.metadata?.amount;
    if (!registerId || !amount) return;
    await this.cashMovementService.register({
      tenantId: payload.tenantId,
      cashRegisterId: registerId,
      type: 'out',
      amount,
      referenceType: 'sales_return',
      referenceId: payload.documentId,
      description: `Reembolso por devolución ${payload.documentId}`,
      userId: payload.triggeredBy,
    });
  }
}
