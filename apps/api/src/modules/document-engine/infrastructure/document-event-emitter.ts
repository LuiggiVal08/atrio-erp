import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface DocumentEventPayload {
  eventType: string;
  tenantId: string;
  documentId: string;
  documentType: string;
  timestamp: string;
  triggeredBy: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class DocumentEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(eventName: string, payload: DocumentEventPayload): void {
    this.eventEmitter.emit(eventName, payload);
    this.eventEmitter.emit('document.status-changed', payload);
  }
}
