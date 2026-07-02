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
      cashRegisterId: registerId,
      type: 'in',
      amount,
      referenceType: payload.documentType,
      referenceId: payload.documentId,
      description: `Payment for ${payload.documentType} ${payload.documentId}`,
      userId: payload.triggeredBy,
    });
  }
}
