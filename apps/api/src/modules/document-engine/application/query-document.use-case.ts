import { DocumentRepository, DocumentFilters } from '../domain/document.repository.interface';
import { DocumentEventRepository } from '../domain/document-event.repository.interface';

export class QueryDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly eventRepository: DocumentEventRepository,
  ) {}

  async execute(tenantId: string, filters: DocumentFilters) {
    return this.documentRepository.findAll(tenantId, filters);
  }

  async findById(id: string, tenantId: string) {
    return this.documentRepository.findByIdWithLines(id, tenantId);
  }

  async softDelete(id: string, tenantId: string) {
    return this.documentRepository.softDelete(id, tenantId);
  }

  async getEvents(documentId: string, tenantId: string) {
    return this.eventRepository.findByDocumentId(documentId, tenantId);
  }
}
