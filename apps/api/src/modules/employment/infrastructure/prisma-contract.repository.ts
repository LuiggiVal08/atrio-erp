import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ContractRepository } from '../domain/contract.repository.interface';
import { Contract, CreateContractData, TerminateContractData, computeContractStatus } from '../domain/contract.entity';

@Injectable()
export class PrismaContractRepository implements ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateContractData): Promise<Contract> {
    return (await this.prisma.contract.create({
      data: {
        relationshipId: data.relationshipId,
        contractType: data.contractType as any,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        renewedFromContractId: data.renewedFromContractId ?? null,
        reason: data.reason as any,
        metadata: (data.metadata ?? undefined) as any,
      },
    })) as any;
  }

  async findById(id: string): Promise<Contract | null> {
    return (await this.prisma.contract.findUnique({ where: { id } })) as any;
  }

  async findCurrentAt(relationshipId: string, effectiveDate?: Date): Promise<Contract | null> {
    const ref = effectiveDate ?? new Date();
    return (await this.prisma.contract.findFirst({
      where: {
        relationshipId,
        status: 'ACTIVE',
        startDate: { lte: ref },
        OR: [
          { endDate: null },
          { endDate: { gte: ref } },
        ],
      },
      orderBy: { startDate: 'desc' },
    })) as any;
  }

  async findByRelationship(relationshipId: string): Promise<Contract[]> {
    return (await this.prisma.contract.findMany({
      where: { relationshipId },
      orderBy: { startDate: 'desc' },
    })) as any;
  }

  async findOverlapping(
    relationshipId: string, startDate: Date, endDate: Date | null, excludeContractId?: string,
  ): Promise<Contract[]> {
    const where: any = {
      relationshipId,
      status: { notIn: ['TERMINATED', 'CANCELLED', 'EXPIRED'] },
      startDate: { lt: endDate ?? new Date('9999-12-31') },
      OR: [
        { endDate: null },
        { endDate: { gt: startDate } },
      ],
    };
    if (excludeContractId) where.id = { not: excludeContractId };
    return (await this.prisma.contract.findMany({ where })) as any;
  }

  async terminate(data: TerminateContractData): Promise<Contract> {
    return (await this.prisma.contract.update({
      where: { id: data.contractId },
      data: {
        terminatedAt: new Date(data.terminatedAt),
        reason: data.reason as any,
        status: 'TERMINATED' as any,
      },
    })) as any;
  }
}
