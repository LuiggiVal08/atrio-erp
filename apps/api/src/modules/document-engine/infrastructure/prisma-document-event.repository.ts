import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { DocumentEventRepository } from '../domain/document-event.repository.interface';
import { DocumentEvent, CreateDocumentEventData } from '../domain/document-event.entity';

@Injectable()
export class PrismaDocumentEventRepository implements DocumentEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDocumentEventData): Promise<DocumentEvent> {
    const event = await this.prisma.documentEvent.create({
      data: {
        tenantId: data.tenantId,
        documentId: data.documentId,
        eventType: data.eventType,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        payload: data.payload as any,
        createdById: data.createdById,
      },
    });
    return this.mapToEntity(event);
  }

  async findByDocumentId(documentId: string, tenantId: string): Promise<DocumentEvent[]> {
    const events = await this.prisma.documentEvent.findMany({
      where: { documentId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return events.map((e) => this.mapToEntity(e));
  }

  private mapToEntity(event: any): DocumentEvent {
    return {
      ...event,
      payload: event.payload ? (event.payload as Record<string, any>) : null,
    };
  }
}
