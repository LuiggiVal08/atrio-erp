import { DocumentEvent, CreateDocumentEventData } from './document-event.entity';

export interface DocumentEventRepository {
  create(data: CreateDocumentEventData): Promise<DocumentEvent>;
  findByDocumentId(documentId: string, tenantId: string): Promise<DocumentEvent[]>;
}
