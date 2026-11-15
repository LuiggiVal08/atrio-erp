import { EmployeeTenantGuard } from '../../src/modules/employee/infrastructure/employee-tenant.guard';
import { EmployeeSetupService } from '../../src/modules/employee/infrastructure/employee-setup.service';
import { PrismaCompensationRepository } from '../../src/modules/employment/infrastructure/prisma-compensation.repository';

const request = (params: any = {}, body: any = {}, path = 'employees/:id') => ({
  switchToHttp: () => ({ getRequest: () => ({ user: { tenantId: 'tenant-a', id: 'actor' }, params, body, route: { path } }) }),
});

describe('Employee audit tenant isolation', () => {
  it.each([
    ['/departments/:id', 'department'],
    ['/positions/:id', 'position'],
    ['/assignments/:id/end', 'positionAssignment'],
    ['/employment-relationships/:id/changes', 'employmentRelationship'],
    ['/contracts/:id/terminate', 'contract'],
    ['/compensation/:id', 'compensationAgreement'],
  ])('scopes Express route %s to the tenant', async (path, model) => {
    const lookup = jest.fn().mockResolvedValue(null);
    await expect(new EmployeeTenantGuard({ [model]: { findFirst: lookup } } as any)
      .canActivate(request({ id: 'foreign' }, {}, path) as any)).rejects.toThrow('not found');
    expect(lookup).toHaveBeenCalledWith({ where: expect.objectContaining({ id: 'foreign' }) });
  });
  it('scopes employee filters on relationship lists', async () => {
    const lookup = jest.fn().mockResolvedValue(null);
    const ctx = { switchToHttp: () => ({ getRequest: () => ({ user: { tenantId: 'tenant-a' }, params: {}, query: { employeeId: 'foreign' }, route: { path: '/tenants/:tenantId/employment-relationships' } }) }) };
    await expect(new EmployeeTenantGuard({ employee: { findFirst: lookup } } as any).canActivate(ctx as any)).rejects.toThrow('not found');
  });
  it('rejects a mismatching URL before any resource lookup', async () => {
    const prisma = { employee: { findFirst: jest.fn() } };
    await expect(new EmployeeTenantGuard(prisma as any).canActivate(request({ tenantId: 'tenant-b' }) as any)).rejects.toThrow('Tenant');
    expect(prisma.employee.findFirst).not.toHaveBeenCalled();
  });
  it('scopes employee IDs to the authenticated tenant', async () => {
    const prisma = { employee: { findFirst: jest.fn().mockResolvedValue(null) } };
    await expect(new EmployeeTenantGuard(prisma as any).canActivate(request({ id: 'foreign' }) as any)).rejects.toThrow('not found');
    expect(prisma.employee.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'foreign', tenantId: 'tenant-a', deletedAt: null } }));
  });
  it('rejects compensation linked to another relationship', async () => {
    const prisma = {
      employmentRelationship: { findFirst: jest.fn().mockResolvedValue({ id: 'rel' }) },
      compensationAgreement: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    await expect(new EmployeeTenantGuard(prisma as any).canActivate(request({ relationshipId: 'rel', agreementId: 'other' }, {}, 'employment-relationships/:relationshipId/compensation/:agreementId/adjust') as any)).rejects.toThrow('not found');
    expect(prisma.compensationAgreement.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'other', relationshipId: 'rel', relationship: { tenantId: 'tenant-a' } }) }));
  });
});

const setup = () => ({
  employee: { id: 'stable-id', firstName: 'Ana', lastName: 'Perez', identityDoc: '123', hireDate: '2026-01-01', baseSalary: 100 },
  departmentId: 'dept', positionId: 'pos',
  employment: { startDate: '2026-01-01', reason: 'NEW_HIRE' },
  contract: { contractType: 'FULL_TIME', startDate: '2026-01-01' },
  compensation: { effectiveDate: '2026-01-01', currency: 'EUR', components: [{ type: 'SALARY', amount: 100 }] },
});

describe('Atomic employee setup', () => {
  function fixture() {
    const tx: any = {
      employee: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'stable-id' }) },
      department: { findFirst: jest.fn().mockResolvedValue({ id: 'dept', name: 'Ventas' }), create: jest.fn() },
      position: { findFirst: jest.fn().mockResolvedValue({ id: 'pos', departmentId: 'dept', name: 'Vendedor' }), create: jest.fn() },
      positionAssignment: { create: jest.fn() },
      employmentRelationship: { create: jest.fn().mockResolvedValue({ id: 'rel' }) },
      contract: { create: jest.fn() },
      compensationAgreement: { create: jest.fn() },
      employmentChange: { create: jest.fn(), findFirst: jest.fn() },
    };
    const prisma: any = { $transaction: jest.fn((fn) => fn(tx)) };
    return { tx, prisma, service: new EmployeeSetupService(prisma) };
  }
  it('reuses selected structure and persists all seven records inside one transaction', async () => {
    const { tx, prisma, service } = fixture();
    await service.setup('tenant-a', 'actor', setup() as any);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.department.create).not.toHaveBeenCalled();
    expect(tx.position.create).not.toHaveBeenCalled();
    expect(tx.employee.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: 'stable-id', departmentId: 'dept', tenantId: 'tenant-a' }) }));
    expect(tx.contract.create).toHaveBeenCalled();
    expect(tx.compensationAgreement.create).toHaveBeenCalled();
    expect(tx.employmentChange.create).toHaveBeenCalled();
  });
  it('prevalidates zero salary before starting a transaction', async () => {
    const { prisma, service } = fixture();
    const data = setup(); data.employee.baseSalary = 0;
    await expect(service.setup('tenant-a', 'actor', data as any)).rejects.toThrow();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('requires a fixed contract end date before writing', async () => {
    const { prisma, service } = fixture();
    const data = setup(); data.contract.contractType = 'FIXED_TERM';
    await expect(service.setup('tenant-a', 'actor', data as any)).rejects.toThrow('endDate');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('rejects a position in a different department before any writes', async () => {
    const { tx, service } = fixture();
    tx.position.findFirst.mockResolvedValue(null);
    await expect(service.setup('tenant-a', 'actor', setup() as any)).rejects.toThrow();
    expect(tx.employee.create).not.toHaveBeenCalled();
  });
  it('propagates a late failure so the transaction rolls back', async () => {
    const { tx, service } = fixture();
    tx.compensationAgreement.create.mockRejectedValue(new Error('unavailable'));
    await expect(service.setup('tenant-a', 'actor', setup() as any)).rejects.toThrow('unavailable');
  });
  it('replays the same stable employee ID without new writes and rejects changed payloads', async () => {
    const { tx, service } = fixture();
    await service.setup('tenant-a', 'actor', setup() as any);
    const saved = tx.employmentChange.create.mock.calls[0][0].data;
    tx.employee.findFirst.mockResolvedValue({ id: 'stable-id' });
    tx.employmentChange.findFirst.mockResolvedValue({ ...saved, relationshipId: 'rel' });
    tx.employee.create.mockClear();
    expect(await service.setup('tenant-a', 'actor', setup() as any)).toEqual({ employee: { id: 'stable-id' }, relationshipId: 'rel' });
    expect(tx.employee.create).not.toHaveBeenCalled();
    const changed = setup(); changed.employee.firstName = 'Changed';
    await expect(service.setup('tenant-a', 'actor', changed as any)).rejects.toThrow('different');
  });
});

describe('Immutable compensation versions', () => {
  it('atomically inserts the version and audit without updating historical salary', async () => {
    const tx: any = {
      employmentRelationship: { findFirst: jest.fn().mockResolvedValue({ id: 'rel', status: 'ACTIVE', startDate: new Date('2026-01-01') }) },
      compensationAgreement: {
        findFirst: jest.fn().mockResolvedValue({ id: 'old', relationshipId: 'rel', effectiveDate: new Date('2026-01-01'), currency: 'EUR', components: [{ type: 'SALARY', amount: 100 }] }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'new', components: [{ type: 'SALARY', amount: 150 }] }),
        update: jest.fn(),
      },
      employmentChange: { create: jest.fn() },
    };
    const prisma: any = { $transaction: jest.fn((fn) => fn(tx)) };
    await new PrismaCompensationRepository(prisma).adjustVersion({ relationshipId: 'rel', previousAgreementId: 'old', effectiveDate: '2026-02-01', currency: 'EUR', reason: 'MERIT_INCREASE', changedBy: 'actor', components: [{ type: 'SALARY', amount: 150 }] });
    expect(tx.compensationAgreement.update).not.toHaveBeenCalled();
    expect(tx.employmentChange.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ reason: 'MERIT_INCREASE' }) }));
  });
});
