import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CompensationRepository } from '../domain/compensation.repository.interface';
import { CompensationAgreement, CreateCompensationData, AdjustCompensationData } from '../domain/compensation.entity';

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

  async adjustVersion(data: AdjustCompensationData): Promise<CompensationAgreement> {
    const effectiveDate = new Date(data.effectiveDate);
    if (!Number.isFinite(effectiveDate.getTime())) throw new BadRequestException('Invalid effective date');
    if (!data.reason || !data.changedBy) throw new BadRequestException('Reason and actor are required');
    if (!data.components.length || data.components.some(c => !Number.isFinite(c.amount) || c.amount <= 0)) throw new BadRequestException('Amount must be greater than 0');
    const result = await this.prisma.$transaction(async tx => {
      const relationship = await tx.employmentRelationship.findFirst({ where: { id: data.relationshipId } });
      if (!relationship) throw new NotFoundException('Employment relationship not found');
      if (relationship.status !== 'ACTIVE') throw new BadRequestException('Employment relationship must be active');
      const previous = await tx.compensationAgreement.findFirst({
        where: { relationshipId: data.relationshipId }, orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }], include: { components: true },
      });
      if (!previous || previous.id !== data.previousAgreementId) throw new ConflictException('Compensation changed; reload the latest agreement');
      if (effectiveDate <= previous.effectiveDate || effectiveDate < relationship.startDate) throw new BadRequestException('Effective date must follow the previous agreement');
      const agreement = await tx.compensationAgreement.create({ data: {
        relationshipId: data.relationshipId, effectiveDate, currency: data.currency ?? previous.currency,
        components: { create: data.components.map(c => ({ type: c.type, amount: c.amount })) },
      }, include: { components: true } });
      await tx.employmentChange.create({ data: {
        relationshipId: data.relationshipId, changeType: 'COMPENSATION_CHANGED', reason: data.reason, changedBy: data.changedBy,
        previousValue: { agreementId: previous.id, currency: previous.currency, components: previous.components.map(c => ({ type: c.type, amount: Number(c.amount) })) },
        newValue: { agreementId: agreement.id, effectiveDate: data.effectiveDate, currency: agreement.currency, components: data.components.map(c => ({ type: c.type, amount: c.amount })) },
      } });
      return agreement;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
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
