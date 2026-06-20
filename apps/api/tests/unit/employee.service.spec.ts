import { ManageEmployeeUseCase } from '../../src/modules/employee/application/manage-employee.use-case';
import { EmployeeRepository } from '../../src/modules/employee/domain/employee.repository.interface';

describe('ManageEmployeeUseCase', () => {
  let manageEmployeeUseCase: ManageEmployeeUseCase;

  const mockEmployeeRepo: EmployeeRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByTenant: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    manageEmployeeUseCase = new ManageEmployeeUseCase(mockEmployeeRepo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      tenantId: 'tenant-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      identityDoc: 'V-12345678',
      hireDate: '2024-01-15',
      department: 'Contabilidad',
      position: 'Contador',
      baseSalary: 1200,
    };

    it('should create an employee', async () => {
      (mockEmployeeRepo.create as jest.Mock).mockResolvedValue({ id: 'emp-1', ...dto });
      const result = await manageEmployeeUseCase.create(dto);
      expect(result.id).toBe('emp-1');
    });

    it('should throw on duplicate identityDoc', async () => {
      (mockEmployeeRepo.create as jest.Mock).mockRejectedValue(new Error('Identity document already exists in this tenant'));
      await expect(manageEmployeeUseCase.create(dto)).rejects.toThrow('Identity document already exists in this tenant');
    });
  });

  describe('softDelete', () => {
    it('should soft delete an employee', async () => {
      (mockEmployeeRepo.findById as jest.Mock).mockResolvedValue({ id: 'emp-1', deletedAt: null });
      (mockEmployeeRepo.update as jest.Mock).mockResolvedValue({ id: 'emp-1', deletedAt: new Date(), status: 'inactive' });

      const result = await manageEmployeeUseCase.softDelete('emp-1');
      expect(result.status).toBe('inactive');
    });
  });
});
