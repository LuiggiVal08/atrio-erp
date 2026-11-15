import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BranchService } from '../../../src/modules/inventory/application/branch.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

const baseBranch = {
  id: 'branch-1',
  tenantId: 'tenant-1',
  name: 'Sede Principal',
  code: 'SEDE',
  address: 'Av. Principal',
  city: 'Caracas',
  state: 'Distrito Capital',
  phone: '+58 212 000-0000',
  managerEmployeeId: null,
  isActive: true,
  createdAt: new Date(),
};

describe('BranchService', () => {
  let service: BranchService;
  const mockRepo = {
    createBranch: jest.fn(),
    findAllBranches: jest.fn(),
    findBranchById: jest.fn(),
    updateBranch: jest.fn(),
    softDeleteBranch: jest.fn(),
    countActiveWarehousesByBranch: jest.fn(),
    employeeBelongsToTenant: jest.fn(),
  } as unknown as InventoryRepository;

  beforeEach(() => {
    service = new BranchService(mockRepo);
    jest.clearAllMocks();
    (mockRepo.countActiveWarehousesByBranch as jest.Mock).mockResolvedValue(0);
  });

  it('lists branches with the inactive flag forwarded', async () => {
    (mockRepo.findAllBranches as jest.Mock).mockResolvedValue([baseBranch]);

    await service.findAll('tenant-1', true);

    expect(mockRepo.findAllBranches).toHaveBeenCalledWith('tenant-1', true);
  });

  it('finds a branch scoped to the tenant', async () => {
    (mockRepo.findBranchById as jest.Mock).mockResolvedValue(baseBranch);

    await expect(service.findById('tenant-1', 'branch-1')).resolves.toBe(baseBranch);
  });

  it('returns 404 for a branch of another tenant', async () => {
    (mockRepo.findBranchById as jest.Mock).mockResolvedValue({ ...baseBranch, tenantId: 'tenant-2' });

    await expect(service.findById('tenant-1', 'branch-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when updating a branch of another tenant', async () => {
    (mockRepo.findBranchById as jest.Mock).mockResolvedValue({ ...baseBranch, tenantId: 'tenant-2' });

    await expect(service.update('tenant-1', 'branch-1', { name: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mockRepo.updateBranch).not.toHaveBeenCalled();
  });

  it('blocks deactivation when the branch has active warehouses', async () => {
    (mockRepo.findBranchById as jest.Mock).mockResolvedValue(baseBranch);
    (mockRepo.countActiveWarehousesByBranch as jest.Mock).mockResolvedValue(2);

    await expect(service.update('tenant-1', 'branch-1', { isActive: false })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockRepo.updateBranch).not.toHaveBeenCalled();
  });

  it('allows deactivation when there are no active warehouses', async () => {
    (mockRepo.findBranchById as jest.Mock).mockResolvedValue(baseBranch);
    (mockRepo.updateBranch as jest.Mock).mockResolvedValue({ ...baseBranch, isActive: false });

    const result = await service.update('tenant-1', 'branch-1', { isActive: false });

    expect(result.isActive).toBe(false);
    expect(mockRepo.updateBranch).toHaveBeenCalledWith('branch-1', { isActive: false });
  });

  it('blocks soft delete when the branch has active warehouses', async () => {
    (mockRepo.findBranchById as jest.Mock).mockResolvedValue(baseBranch);
    (mockRepo.countActiveWarehousesByBranch as jest.Mock).mockResolvedValue(1);

    await expect(service.softDelete('tenant-1', 'branch-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockRepo.softDeleteBranch).not.toHaveBeenCalled();
  });

  it('rejects a manager that does not belong to the tenant', async () => {
    (mockRepo.employeeBelongsToTenant as jest.Mock).mockResolvedValue(false);

    await expect(
      service.create({ tenantId: 'tenant-1', name: 'Sede', managerEmployeeId: 'employee-x' }),
    ).rejects.toMatchObject({
      response: {
        errors: [{ field: 'managerEmployeeId' }],
      },
    });
    expect(mockRepo.createBranch).not.toHaveBeenCalled();
  });

  it('creates a branch with a valid manager', async () => {
    (mockRepo.employeeBelongsToTenant as jest.Mock).mockResolvedValue(true);
    (mockRepo.createBranch as jest.Mock).mockResolvedValue(baseBranch);

    await service.create({
      tenantId: 'tenant-1',
      name: 'Sede Principal',
      city: 'Caracas',
      state: 'Distrito Capital',
      managerEmployeeId: 'employee-1',
    });

    expect(mockRepo.employeeBelongsToTenant).toHaveBeenCalledWith('tenant-1', 'employee-1');
    expect(mockRepo.createBranch).toHaveBeenCalledWith(
      expect.objectContaining({ managerEmployeeId: 'employee-1' }),
    );
  });

  it('maps a duplicate code to a field conflict', async () => {
    const duplicate = Object.assign(new Error('duplicate'), { code: 'P2002' });
    (mockRepo.createBranch as jest.Mock).mockRejectedValue(duplicate);

    const error = await service
      .create({ tenantId: 'tenant-1', name: 'Sede', code: 'SEDE' })
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toMatchObject({
      errors: [{ field: 'code', message: expect.any(String) }],
    });
  });
});
