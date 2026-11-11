import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CompensationRepository } from '../domain/compensation.repository.interface';
import { CompensationAgreement, CreateCompensationData } from '../domain/compensation.entity';

@Injectable()
export class PrismaCompensationRepository implements CompensationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCompensationData): Promise<CompensationAgreement> {
    const result = await this.prisma.compensationAgreement.create({
      data: {
        relationshipId: data.relationshipId,
        effectiveDate: new Date(data.effectiveDate),
        currency: data.currency ?? 'USD',
        components: {
          create: data.components.map(c => ({
            type: c.type as any,
            amount: c.amount,
          })),
        },
      },
      include: { components: true },
    });
    return this.mapToDomain(result);
  }

  async findById(id: string): Promise<CompensationAgreement | null> {
    const result = await this.prisma.compensationAgreement.findUnique({
      where: { id },
      include: { components: true },
    });
    return result ? this.mapToDomain(result) : null;
  }

  async findCurrentAt(relationshipId: string, effectiveDate: Date): Promise<CompensationAgreement | null> {
    const result = await this.prisma.compensationAgreement.findFirst({
      where: {
        relationshipId,
        effectiveDate: { lte: effectiveDate },
        OR: [
          { endedAt: null },
          { endedAt: { gte: effectiveDate } },
        ],
      },
      include: { components: true },
      orderBy: { effectiveDate: 'desc' },
    });
    return result ? this.mapToDomain(result) : null;
  }

  async findByRelationship(relationshipId: string): Promise<CompensationAgreement[]> {
    const results = await this.prisma.compensationAgreement.findMany({
      where: { relationshipId },
      include: { components: true },
      orderBy: { effectiveDate: 'desc' },
    });
    return results.map(r => this.mapToDomain(r));
  }

  async findOverlapping(
    relationshipId: string, effectiveDate: Date, excludeAgreementId?: string,
  ): Promise<CompensationAgreement[]> {
    const where: any = {
      relationshipId,
      effectiveDate: { lte: effectiveDate },
      OR: [
        { endedAt: null },
        { endedAt: { gte: effectiveDate } },
      ],
    };
    if (excludeAgreementId) where.id = { not: excludeAgreementId };
    const results = await this.prisma.compensationAgreement.findMany({
      where,
      include: { components: true },
    });
    return results.map(r => this.mapToDomain(r));
  }

  private mapToDomain(raw: any): CompensationAgreement {
    return {
      id: raw.id,
      relationshipId: raw.relationshipId,
      effectiveDate: raw.effectiveDate,
      endedAt: raw.endedAt,
      currency: raw.currency,
      components: raw.components?.map((c: any) => ({
        id: c.id,
        agreementId: c.agreementId,
        type: c.type,
        amount: Number(c.amount),
        createdAt: c.createdAt,
      })) ?? [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
