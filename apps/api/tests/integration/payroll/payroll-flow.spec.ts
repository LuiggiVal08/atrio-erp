import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { ManagePayrollUseCase } from '../../../src/modules/payroll/application/manage-payroll.use-case';
import { PayrollDomainEvent } from '../../../src/modules/payroll/domain/domain-events';
import { createTestApp, seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Payroll Period Flow (vertical)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let useCase: ManagePayrollUseCase;

  let events: PayrollDomainEvent[];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    useCase = app.get(ManagePayrollUseCase);

    const emitter = app.get(EventEmitter2);
    events = [];
    emitter.onAny((event: string, payload: PayrollDomainEvent) => {
      if (event.startsWith('payroll.')) {
        events.push(payload);
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Full flow: create → generate → pay → close', () => {
    let seed: TestSeed;
    let departmentId: string;
    let employeeId: string;
    let positionId: string;
    let relationshipId: string;

    afterAll(async () => {
      if (seed) await cleanupTestData(app, seed);
    });

    it('should create employee with department, position, contract and compensation data', async () => {
      seed = await seedTestData(app);

      // Create department
      const dept = await prisma.department.create({
        data: {
          tenantId: seed.tenantId,
          name: 'Engineering',
          isActive: true,
        },
      });
      departmentId = dept.id;

      // Create employee
      const emp = await prisma.employee.create({
        data: {
          tenantId: seed.tenantId,
          firstName: 'María',
          middleName: 'Elena',
          lastName: 'García',
          identityDoc: 'V-12345678',
          hireDate: new Date('2024-01-01'),
          department: 'Engineering',
          departmentId: departmentId,
          position: 'Senior Developer',
          baseSalary: 2500,
          status: 'active',
        },
      });
      employeeId = emp.id;

      // Create position
      const pos = await prisma.position.create({
        data: {
          tenantId: seed.tenantId,
          departmentId: departmentId,
          name: 'Senior Developer',
          code: 'SR-DEV',
          active: true,
        },
      });
      positionId = pos.id;

      // Create employment relationship (ACTIVE)
      const rel = await prisma.employmentRelationship.create({
        data: {
          tenantId: seed.tenantId,
          employeeId: employeeId,
          status: 'ACTIVE',
          startDate: new Date('2024-01-01'),
        },
      });
      relationshipId = rel.id;

      // Create position assignment
      await prisma.positionAssignment.create({
        data: {
          tenantId: seed.tenantId,
          employeeId: employeeId,
          positionId: positionId,
          startDate: new Date('2024-01-01'),
        },
      });

      // Create contract (ACTIVE)
      await prisma.contract.create({
        data: {
          relationshipId: relationshipId,
          contractType: 'FULL_TIME',
          status: 'ACTIVE',
          startDate: new Date('2024-01-01'),
        },
      });

      // Create compensation agreement with SALARY component
      const agreement = await prisma.compensationAgreement.create({
        data: {
          relationshipId: relationshipId,
          effectiveDate: new Date('2024-01-01'),
          currency: 'USD',
        },
      });

      await prisma.compensationComponent.create({
        data: {
          agreementId: agreement.id,
          type: 'SALARY',
          amount: 2500,
        },
      });
    });

    it('should CREATE a payroll period in OPEN status', async () => {
      const period = await useCase.createPeriod(
        seed.tenantId,
        '2024-06-01',
        '2024-06-30',
        'June 2024 payroll',
      );

      expect(period).toBeDefined();
      expect(period.id).toBeDefined();
      expect(period.status).toBe('OPEN');
      expect(period.tenantId).toBe(seed.tenantId);
      expect(period.notes).toBe('June 2024 payroll');
    });

    beforeEach(() => {
      events.length = 0;
    });

    it('should GENERATE payslips and auto-lock the period', async () => {
      const periods = await prisma.payrollPeriod.findMany({
        where: { tenantId: seed.tenantId, status: 'OPEN' },
      });
      expect(periods.length).toBe(1);
      const periodId = periods[0].id;

      const payslips = await useCase.generate(periodId);

      expect(payslips.length).toBe(1);

      const ps = payslips[0];
      expect(ps.periodId).toBe(periodId);
      expect(ps.tenantId).toBe(seed.tenantId);
      expect(ps.employeeId).toBe(employeeId);
      expect(ps.employeeName).toBe('María Elena García');
      expect(ps.employeeNumber).toBe('V-12345678');
      expect(ps.relationshipId).toBe(relationshipId);
      expect(ps.baseSalary).toBe(2500);
      expect(ps.currency).toBe('USD');

      expect(ps.contractId).not.toBeNull();
      expect(ps.contractType).toBe('FULL_TIME');

      expect(ps.positionAssignmentId).not.toBeNull();
      expect(ps.positionId).toBe(positionId);
      expect(ps.positionName).toBe('Senior Developer');

      expect(ps.departmentId).toBe(departmentId);
      expect(ps.departmentName).toBe('Engineering');

      expect(ps.compensationAgreementId).not.toBeNull();

      // Verify period is now LOCKED
      const period = await useCase.findPeriodById(periodId);
      expect(period.status).toBe('LOCKED');

      // Verify domain events: generated + locked (auto-lock)
      expect(events.length).toBe(2);
      const [genEvent, lockEvent] = events;
      expect(genEvent.eventType).toBe('payroll.period.generated');
      expect(genEvent.periodId).toBe(periodId);
      expect(genEvent.data?.payslipCount).toBe(1);
      expect(lockEvent.eventType).toBe('payroll.period.locked');
      expect(lockEvent.periodId).toBe(periodId);
      expect(lockEvent.data?.payslipCount).toBe(1);
    });

    it('should REJECT regenerate on a LOCKED period', async () => {
      const periods = await prisma.payrollPeriod.findMany({
        where: { tenantId: seed.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      const periodId = periods[0].id;

      await expect(useCase.generate(periodId)).rejects.toThrow();
    });

    it('should PAY the period through a bank outflow', async () => {
      const periods = await prisma.payrollPeriod.findMany({
        where: { tenantId: seed.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      const periodId = periods[0].id;

      const bankAccount = await prisma.bankAccount.create({
        data: {
          tenantId: seed.tenantId,
          name: 'Payroll account',
          accountNumber: '000123',
          bankName: 'Test bank',
          accountType: 'checking',
          currency: 'USD',
          balance: 3000,
        },
      });

      const paid = await useCase.payWithBank(
        periodId,
        seed.tenantId,
        bankAccount.id,
        seed.userId,
      );
      expect(paid.status).toBe('PAID');
      expect((await prisma.bankAccount.findUniqueOrThrow({ where: { id: bankAccount.id } })).balance)
        .toBe(500);
      expect(await prisma.bankMovement.count({
        where: { referenceId: periodId, referenceType: 'payroll-period', type: 'out' },
      })).toBe(1);

      expect(events.length).toBe(1);
      const [payEvent] = events;
      expect(payEvent.eventType).toBe('payroll.period.paid');
      expect(payEvent.periodId).toBe(periodId);
    });

    it('should CLOSE the period', async () => {
      const periods = await prisma.payrollPeriod.findMany({
        where: { tenantId: seed.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      const periodId = periods[0].id;

      const closed = await useCase.close(periodId);
      expect(closed.status).toBe('CLOSED');

      expect(events.length).toBe(1);
      const [closeEvent] = events;
      expect(closeEvent.eventType).toBe('payroll.period.closed');
      expect(closeEvent.periodId).toBe(periodId);
    });

    it('should REJECT transition from CLOSED', async () => {
      const periods = await prisma.payrollPeriod.findMany({
        where: { tenantId: seed.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      const periodId = periods[0].id;

      await expect(
        useCase.payWithBank(periodId, seed.tenantId, '00000000-0000-0000-0000-000000000000', seed.userId),
      ).rejects.toThrow();
      await expect(useCase.close(periodId)).rejects.toThrow();
    });

    it('should enforce only one OPEN period per tenant', async () => {
      // Create a throwaway OPEN period, then try creating another — should fail
      const throwaway = await useCase.createPeriod(
        seed.tenantId, '2024-08-01', '2024-08-31', 'Throwaway',
      );
      expect(throwaway.status).toBe('OPEN');

      await expect(
        useCase.createPeriod(seed.tenantId, '2024-09-01', '2024-09-30'),
      ).rejects.toThrow('An open payroll period already exists for this tenant');
    });
  });
});
