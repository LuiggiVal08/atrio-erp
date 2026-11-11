import type { PrismaService } from '@/infrastructure/database/prisma.service';
import { PrismaCashPaymentsRepository } from '@/modules/cash-payments/infrastructure/prisma-cash-payments.repository';

describe('PrismaCashPaymentsRepository.updatePaymentMethod', () => {
  const updatedPaymentMethod = {
    id: 'method-1',
    tenantId: 'tenant-1',
    name: 'Punto',
    type: 'card',
    currency: 'VES',
    commissionRate: 0.025,
    isActive: true,
    createdAt: new Date('2026-07-08T12:00:00.000Z'),
  };

  it('updates and returns a method scoped to its tenant', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findFirst = jest.fn().mockResolvedValue(updatedPaymentMethod);
    const repository = new PrismaCashPaymentsRepository({
      paymentMethod: { updateMany, findFirst },
    } as unknown as PrismaService);

    const result = await repository.updatePaymentMethod('method-1', 'tenant-1', {
      commissionRate: 0.025,
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'method-1', tenantId: 'tenant-1' },
      data: { commissionRate: 0.025 },
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'method-1', tenantId: 'tenant-1' },
    });
    expect(result?.commissionRate).toBe(0.025);
  });

  it('returns null when the method is not in the tenant', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const findFirst = jest.fn();
    const repository = new PrismaCashPaymentsRepository({
      paymentMethod: { updateMany, findFirst },
    } as unknown as PrismaService);

    const result = await repository.updatePaymentMethod('method-1', 'other-tenant', {
      name: 'Punto',
    });

    expect(result).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });
});
