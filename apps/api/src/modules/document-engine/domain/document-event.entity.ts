import { DocumentStatus } from './document.entity';

export interface DocumentEvent {
  id: string;
  tenantId: string;
  documentId: string;
  eventType: string;
  previousStatus?: DocumentStatus | null;
  newStatus?: DocumentStatus | null;
  payload?: Record<string, any> | null;
  createdById: string;
  createdAt: Date;
}

export interface CreateDocumentEventData {
  tenantId: string;
  documentId: string;
  eventType: string;
  previousStatus?: DocumentStatus | null;
  newStatus?: DocumentStatus | null;
  payload?: Record<string, any> | null;
  createdById: string;
}
