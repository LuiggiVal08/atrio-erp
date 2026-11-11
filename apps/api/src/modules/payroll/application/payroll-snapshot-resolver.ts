import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CONTRACT_REPOSITORY } from '../../employment/infrastructure/employment.module';
import type { ContractRepository } from '../../employment/domain/contract.repository.interface';
import { COMPENSATION_REPOSITORY } from '../../employment/infrastructure/employment.module';
import type { CompensationRepository } from '../../employment/domain/compensation.repository.interface';
import { PayslipSnapshot } from '../domain/payroll-period.entity';

export interface ResolveInput {
  relationshipId: string;
  employeeId: string;
  effectiveDate: Date;
}

@Injectable()
export class PayrollSnapshotResolver {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTRACT_REPOSITORY) private readonly contractRepository: ContractRepository,
    @Inject(COMPENSATION_REPOSITORY) private readonly compensationRepository: CompensationRepository,
  ) {}

  async resolve(input: ResolveInput): Promise<PayslipSnapshot | null> {
    const { relationshipId, employeeId, effectiveDate } = input;

    const [employee, contract, compensation] = await Promise.all([
      this.prisma.employee.findUnique({ where: { id: employeeId } }),
      this.contractRepository.findCurrentAt(relationshipId, effectiveDate),
      this.compensationRepository.findCurrentAt(relationshipId, effectiveDate),
    ]);

    if (!employee) return null;
    if (!compensation) return null;

    const employeeName = [employee.firstName, employee.middleName, employee.lastName]
      .filter(Boolean).join(' ');

    const employeeNumber = employee.identityDoc;

    let positionAssignment: { id: string; positionId: string } | null = null;
    let position: { name: string } | null = null;

    const assignment = await this.prisma.positionAssignment.findFirst({
      where: {
        employeeId,
        startDate: { lte: effectiveDate },
        OR: [
          { endDate: null },
          { endDate: { gte: effectiveDate } },
        ],
      },
      orderBy: { startDate: 'desc' },
      include: { position: { select: { name: true } } },
    });

    if (assignment) {
      positionAssignment = { id: assignment.id, positionId: assignment.positionId };
      position = assignment.position;
    }

    let departmentId: string | null = null;
    let departmentName: string | null = null;

    if (employee.departmentId) {
      departmentId = employee.departmentId;
      const dept = await this.prisma.department.findUnique({
        where: { id: employee.departmentId },
      });
      departmentName = dept?.name ?? null;
    } else if (employee.department) {
      departmentName = employee.department;
    }

    const salaryComponent = compensation.components.find(c => c.type === 'SALARY');
    if (!salaryComponent) return null;

    return {
      relationshipId,
      employeeId,
      employeeNumber,
      employeeName,
      contractId: contract?.id ?? null,
      contractType: contract?.contractType ?? null,
      compensationAgreementId: compensation.id,
      positionAssignmentId: positionAssignment?.id ?? null,
      positionId: positionAssignment?.positionId ?? null,
      positionName: position?.name ?? null,
      departmentId,
      departmentName,
      currency: compensation.currency,
      baseSalary: salaryComponent.amount,
    };
  }
}
