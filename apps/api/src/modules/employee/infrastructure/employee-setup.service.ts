import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { SetupEmployeeDto } from './dto/setup-employee.dto';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Cross-context onboarding transaction; no partial identity/structure survives failure. */
@Injectable()
export class EmployeeSetupService {
  constructor(private readonly prisma: PrismaService) {}

  async setup(tenantId: string, changedBy: string, data: SetupEmployeeDto) {
    if (!!data.departmentId === !!data.department || !!data.positionId === !!data.position) {
      throw new BadRequestException('Select existing IDs or explicitly create structure, not both');
    }
    if (data.positionId && !data.departmentId) throw new BadRequestException('Existing position requires an existing department');
    const dates = [data.employee.hireDate, data.employment.startDate, data.contract.startDate, data.compensation.effectiveDate];
    if (dates.some(d => !d || !Number.isFinite(new Date(d).getTime())) || dates.some(d => new Date(d).getTime() !== new Date(dates[0]).getTime())) {
      throw new BadRequestException('Onboarding dates must be valid and match');
    }
    if (data.contract.contractType === 'FIXED_TERM' && !data.contract.endDate) throw new BadRequestException('FIXED_TERM requires endDate');
    if (data.contract.endDate && (!Number.isFinite(new Date(data.contract.endDate).getTime()) || new Date(data.contract.endDate) <= new Date(data.contract.startDate))) throw new BadRequestException('endDate must follow startDate');
    const salary = data.compensation.components.filter(c => c.type === 'SALARY');
    if (!Number.isFinite(data.employee.baseSalary) || data.employee.baseSalary <= 0 || salary.length !== 1 || salary[0].amount !== data.employee.baseSalary || data.compensation.components.some(c => !Number.isFinite(c.amount) || c.amount <= 0)) {
      throw new BadRequestException('Positive salary must match the compensation SALARY component');
    }
    const fingerprint = createHash('sha256').update(canonical(data)).digest('hex');
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(async tx => {
          const existing = await tx.employee.findFirst({ where: { id: data.employee.id, tenantId } });
          if (existing) {
            const started = await tx.employmentChange.findFirst({ where: { changeType: 'RELATIONSHIP_STARTED', relationship: { tenantId, employeeId: existing.id } }, orderBy: { createdAt: 'asc' } });
            if ((started?.newValue as any)?.setupFingerprint !== fingerprint) throw new ConflictException('Employee setup ID was used for a different request');
            return { employee: existing, relationshipId: started!.relationshipId };
          }
          // Validate all references before deliberately creating anything.
          let department = data.departmentId ? await tx.department.findFirst({ where: { id: data.departmentId, tenantId, isActive: true } }) : null;
          if (data.departmentId && !department) throw new NotFoundException('Department not found or inactive');
          let position = data.positionId ? await tx.position.findFirst({ where: { id: data.positionId, tenantId, departmentId: data.departmentId, active: true } }) : null;
          if (data.positionId && !position) throw new NotFoundException('Position not found in selected department');
          if (!department) department = await tx.department.create({ data: { tenantId, name: data.department!.name.trim(), description: data.department!.description } });
          if (!position) position = await tx.position.create({ data: { tenantId, departmentId: department.id, ...data.position!, name: data.position!.name.trim() } });
          const employee = await tx.employee.create({ data: { ...data.employee, hireDate: new Date(data.employee.hireDate), tenantId, departmentId: department.id, department: department.name, position: position.name } });
          await tx.positionAssignment.create({ data: { tenantId, employeeId: employee.id, positionId: position.id, startDate: new Date(data.employment.startDate) } });
          const relationship = await tx.employmentRelationship.create({ data: { tenantId, employeeId: employee.id, startDate: new Date(data.employment.startDate), status: 'ACTIVE' } });
          // Store the retry fingerprint in the existing immutable event, not a new schema field.
          await tx.employmentChange.create({ data: { relationshipId: relationship.id, changeType: 'RELATIONSHIP_STARTED', reason: data.employment.reason as any, changedBy, newValue: { status: 'ACTIVE', startDate: data.employment.startDate, setupFingerprint: fingerprint } } });
          const contract = await tx.contract.create({ data: { relationshipId: relationship.id, ...data.contract, metadata: data.contract.metadata as Prisma.InputJsonObject | undefined, contractType: data.contract.contractType as any, reason: data.contract.reason as any, startDate: new Date(data.contract.startDate), endDate: data.contract.endDate ? new Date(data.contract.endDate) : null } });
          const agreement = await tx.compensationAgreement.create({ data: { relationshipId: relationship.id, effectiveDate: new Date(data.compensation.effectiveDate), currency: data.compensation.currency ?? 'USD', components: { create: data.compensation.components.map(c => ({ type: c.type as any, amount: c.amount })) } } });
          await tx.employmentChange.create({ data: { relationshipId: relationship.id, changeType: 'CONTRACT_CREATED', reason: data.employment.reason as any, changedBy, newValue: { contractId: contract?.id, contractType: data.contract.contractType, endDate: data.contract.endDate ?? null } } });
          await tx.employmentChange.create({ data: { relationshipId: relationship.id, changeType: 'COMPENSATION_CHANGED', reason: data.employment.reason as any, changedBy, newValue: { agreementId: agreement?.id, effectiveDate: data.compensation.effectiveDate, currency: data.compensation.currency ?? 'USD', components: data.compensation.components.map(component => ({ type: component.type, amount: component.amount })) } } });
          return { employee, relationshipId: relationship.id };
        }, { isolationLevel: 'Serializable' });
      } catch (error: any) {
        if (['P2034', 'P2002'].includes(error?.code) && attempt < 2) continue;
        if (error?.code === 'P2002') throw new ConflictException('Employee identity or organization already exists');
        throw error;
      }
    }
    throw new ConflictException('Concurrent employee setup; retry the same request');
  }
}
