import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  DocumentRepository,
  DocumentFilters,
  PaginatedResult,
} from '../domain/document.repository.interface';
import { Document, DocumentLine, DocumentStatus, DocumentType } from '../domain/document.entity';

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    tenantId: string;
    documentType: DocumentType;
    documentNumber: string;
    currency: string;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    notes?: string | null;
    createdById: string;
    lines: Array<{
      lineNumber: number;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      taxAmount: number;
      discountRate?: number | null;
      discountAmount: number;
      lineTotal: number;
      productId?: string | null;
      warehouseId?: string | null;
    }>;
  }): Promise<Document> {
    const doc = await this.prisma.document.create({
      data: {
        tenantId: data.tenantId,
        documentType: data.documentType as any,
        documentNumber: data.documentNumber,
        currency: data.currency,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        discountTotal: data.discountTotal,
        grandTotal: data.grandTotal,
        notes: data.notes,
        createdById: data.createdById,
        lines: {
          create: data.lines,
        },
      },
      include: { lines: true },
    });
    return this.mapToEntity(doc);
  }

  async findById(id: string, tenantId: string): Promise<Document | null> {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByIdWithLines(
    id: string,
    tenantId: string,
  ): Promise<{ document: Document; lines: DocumentLine[] } | null> {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    if (!doc) return null;
    return {
      document: this.mapToEntity(doc),
      lines: doc.lines.map((l) => this.mapLineToEntity(l)),
    };
  }

  async findAll(
    tenantId: string,
    filters: DocumentFilters,
  ): Promise<PaginatedResult<Document>> {
    const where: any = { tenantId, deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.documentType) where.documentType = filters.documentType;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: data.map((d) => this.mapToEntity(d)),
      total,
      page,
      limit,
    };
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: DocumentStatus,
    extra?: { approvedById?: string; approvedAt?: Date; rejectionReason?: string; expectedPreviousStatus?: DocumentStatus },
  ): Promise<Document> {
    const updateData: any = { status };
    if (extra?.approvedById) updateData.approvedById = extra.approvedById;
    if (extra?.approvedAt) updateData.approvedAt = extra.approvedAt;
    if (extra?.rejectionReason !== undefined) updateData.rejectionReason = extra.rejectionReason;

    const where: any = { id, tenantId };
    if (extra?.expectedPreviousStatus) {
      const result = await this.prisma.document.updateMany({
        where: { ...where, status: extra.expectedPreviousStatus },
        data: updateData,
      });
      if (result.count === 0) {
        throw new Error(
          `Concurrent modification detected: document ${id} status changed since read`,
        );
      }
      const doc = await this.prisma.document.findUniqueOrThrow({ where: { id } });
      return this.mapToEntity(doc);
    }

    const doc = await this.prisma.document.update({ where, data: updateData });
    return this.mapToEntity(doc);
  }

  async updateCounterDocument(
    id: string,
    tenantId: string,
    originalDocumentId: string,
    counterDocumentType: string,
  ): Promise<Document> {
    const doc = await this.prisma.document.update({
      where: { id, tenantId },
      data: {
        originalDocumentId,
        counterDocumentType: counterDocumentType as any,
      },
    });
    return this.mapToEntity(doc);
  }

  async getNextSequence(prefix: string, tenantId: string): Promise<number> {
    const lastDoc = await this.prisma.document.findFirst({
      where: { tenantId, documentNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
      select: { documentNumber: true },
    });
    if (!lastDoc) return 1;
    const parts = lastDoc.documentNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    return isNaN(lastSeq) ? 1 : lastSeq + 1;
  }

  async softDelete(id: string, tenantId: string): Promise<Document> {
    const doc = await this.prisma.document.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
    return this.mapToEntity(doc);
  }

  private mapToEntity(doc: any): Document {
    return {
      ...doc,
      exchangeRate: doc.exchangeRate ? Number(doc.exchangeRate) : null,
      subtotal: Number(doc.subtotal),
      taxTotal: Number(doc.taxTotal),
      discountTotal: Number(doc.discountTotal),
      grandTotal: Number(doc.grandTotal),
    };
  }

  private mapLineToEntity(line: any): DocumentLine {
    return {
      ...line,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      taxRate: Number(line.taxRate),
      taxAmount: Number(line.taxAmount),
      discountRate: line.discountRate ? Number(line.discountRate) : null,
      discountAmount: Number(line.discountAmount),
      lineTotal: Number(line.lineTotal),
    };
  }
}
