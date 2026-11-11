import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { PrismaEmployeeRepository } from '../../src/modules/employee/infrastructure/prisma-employee.repository';

describe('PrismaEmployeeRepository payment details', () => {
  const employee = { id: 'employee-1' };
  const account = {
    id: 'account-1',
    employeeId: employee.id,
    method: 'BANK',
    bankName: 'Test bank',
    accountType: 'CHECKING',
    accountNumber: '000123456789',
    mobilePaymentPhone: null,
    effectiveFrom: new Date('2026-11-02T00:00:00.000Z'),
  };

  function createRepository(foundEmployee = true) {
    const tx = {
      employee: {
        findFirst: jest.fn().mockResolvedValue(foundEmployee ? employee : null),
      },
      employeePaymentAccount: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue(account),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: unknown) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    return { repository: new PrismaEmployeeRepository(prisma), tx };
  }

  it('ends the prior version and creates an audited current version transactionally', async () => {
    const { repository, tx } = createRepository();
    const data = {
      method: 'BANK' as const,
      bankName: ' Test bank ',
      accountType: 'CHECKING' as const,
      accountNumber: ' 000123456789 ',
    };

    await repository.savePaymentDetails(employee.id, 'tenant-1', 'user-1', data);

    expect(tx.employeePaymentAccount.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { employeeId: employee.id, tenantId: 'tenant-1', isCurrent: true },
      data: expect.objectContaining({ isCurrent: false }),
    }));
    expect(tx.employeePaymentAccount.create).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        employeeId: employee.id,
        tenantId: 'tenant-1',
        createdById: 'user-1',
        method: 'BANK',
        bankName: 'Test bank',
        accountType: 'CHECKING',
        accountNumber: '000123456789',
        mobilePaymentPhone: null,
      },
    }));
  });

  it('does not save details for employees outside the tenant', async () => {
    const { repository, tx } = createRepository(false);

    const result = await repository.savePaymentDetails(employee.id, 'other-tenant', 'user-1', {
      method: 'MOBILE_PAYMENT',
      mobilePaymentPhone: '+584121234567',
    });

    expect(result).toBeNull();
    expect(tx.employeePaymentAccount.updateMany).not.toHaveBeenCalled();
    expect(tx.employeePaymentAccount.create).not.toHaveBeenCalled();
  });
});
