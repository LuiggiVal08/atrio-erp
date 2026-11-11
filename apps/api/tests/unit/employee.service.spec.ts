import { ManageEmployeeUseCase } from '../../src/modules/employee/application/manage-employee.use-case';
import { EmployeeRepository } from '../../src/modules/employee/domain/employee.repository.interface';

describe('ManageEmployeeUseCase', () => {
  let manageEmployeeUseCase: ManageEmployeeUseCase;

  const mockEmployeeRepo: EmployeeRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByTenant: jest.fn(),
    update: jest.fn(),
    findPaymentDetails: jest.fn(),
    savePaymentDetails: jest.fn(),
    clearPaymentDetails: jest.fn(),
    createDepartment: jest.fn(),
    findAllDepartments: jest.fn(),
    findDepartmentById: jest.fn(),
    updateDepartment: jest.fn(),
    deleteDepartment: jest.fn(),
    createSalaryEntry: jest.fn(),
    findSalaryHistory: jest.fn(),
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

    it('should pass employee contact details to the repository', async () => {
      const contactDetails = {
        phone: '+584121234567',
        email: 'juan@example.com',
        address: 'Av. Principal, Caracas',
        emergencyContactName: 'Ana Pérez',
        emergencyContactPhone: '+584141234567',
        taxIdentifier: 'V-12345678',
      };
      (mockEmployeeRepo.create as jest.Mock).mockResolvedValue({ id: 'emp-1', ...dto, ...contactDetails });

      await manageEmployeeUseCase.create({ ...dto, ...contactDetails });

      expect(mockEmployeeRepo.create).toHaveBeenCalledWith({ ...dto, ...contactDetails });
    });

    it('should save payment details scoped to the employee tenant', async () => {
      const details = {
        method: 'BANK' as const,
        bankName: 'Banco de prueba',
        accountType: 'CHECKING' as const,
        accountNumber: '000123456789',
      };
      (mockEmployeeRepo.savePaymentDetails as jest.Mock).mockResolvedValue({
        id: 'payment-1',
        employeeId: 'emp-1',
        effectiveFrom: new Date('2026-11-02'),
        ...details,
      });

      const result = await manageEmployeeUseCase.savePaymentDetails('emp-1', 'tenant-1', 'user-1', details);

      expect(mockEmployeeRepo.savePaymentDetails).toHaveBeenCalledWith('emp-1', 'tenant-1', 'user-1', details);
      expect(result?.accountNumber).toBe(details.accountNumber);
    });

    it('should throw on duplicate identityDoc', async () => {
      (mockEmployeeRepo.create as jest.Mock).mockRejectedValue(new Error('Identity document already exists in this tenant'));
      await expect(manageEmployeeUseCase.create(dto)).rejects.toThrow('Identity document already exists in this tenant');
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      (mockEmployeeRepo.findById as jest.Mock).mockResolvedValue({ id: 'emp-1', deletedAt: null });
      (mockEmployeeRepo.update as jest.Mock).mockResolvedValue({ id: 'emp-1', firstName: 'Juan Updated' });
      const result = await manageEmployeeUseCase.update('emp-1', { firstName: 'Juan Updated' });
      expect(result).toHaveProperty('firstName', 'Juan Updated');
    });

    it('should throw when employee not found', async () => {
      (mockEmployeeRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(manageEmployeeUseCase.update('missing', { firstName: 'X' })).rejects.toThrow('Employee not found');
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

  describe('Departments', () => {
    it('should create a department', async () => {
      (mockEmployeeRepo.createDepartment as jest.Mock).mockResolvedValue({ id: 'dept-1', name: 'IT', tenantId: 't1' });
      const result = await manageEmployeeUseCase.createDepartment({ tenantId: 't1', name: 'IT' });
      expect(result).toHaveProperty('name', 'IT');
    });

    it('should list departments', async () => {
      (mockEmployeeRepo.findAllDepartments as jest.Mock).mockResolvedValue([{ id: 'dept-1', name: 'IT' }]);
      const result = await manageEmployeeUseCase.findAllDepartments('t1');
      expect(result).toHaveLength(1);
    });

    it('should find department by id', async () => {
      (mockEmployeeRepo.findDepartmentById as jest.Mock).mockResolvedValue({ id: 'dept-1', name: 'IT' });
      const result = await manageEmployeeUseCase.findDepartmentById('dept-1');
      expect(result).toHaveProperty('id', 'dept-1');
    });

    it('should throw when department not found', async () => {
      (mockEmployeeRepo.findDepartmentById as jest.Mock).mockResolvedValue(null);
      await expect(manageEmployeeUseCase.findDepartmentById('missing')).rejects.toThrow('Department not found');
    });

    it('should update a department', async () => {
      (mockEmployeeRepo.findDepartmentById as jest.Mock).mockResolvedValue({ id: 'dept-1' });
      (mockEmployeeRepo.updateDepartment as jest.Mock).mockResolvedValue({ id: 'dept-1', name: 'Engineering' });
      const result = await manageEmployeeUseCase.updateDepartment('dept-1', { name: 'Engineering' });
      expect(result).toHaveProperty('name', 'Engineering');
    });

    it('should delete a department', async () => {
      (mockEmployeeRepo.findDepartmentById as jest.Mock).mockResolvedValue({ id: 'dept-1', name: 'IT' });
      await manageEmployeeUseCase.deleteDepartment('dept-1');
      expect(mockEmployeeRepo.deleteDepartment).toHaveBeenCalledWith('dept-1');
    });
  });

  describe('Salary History', () => {
    it('should create a salary entry', async () => {
      (mockEmployeeRepo.createSalaryEntry as jest.Mock).mockResolvedValue({ id: 'sal-1', salary: 1500, employeeId: 'emp-1' });
      const result = await manageEmployeeUseCase.createSalaryEntry({ employeeId: 'emp-1', salary: 1500, effectiveDate: '2024-06-01' });
      expect(result).toHaveProperty('salary', 1500);
    });

    it('should list salary history', async () => {
      (mockEmployeeRepo.findSalaryHistory as jest.Mock).mockResolvedValue([{ id: 'sal-1', salary: 1500 }]);
      const result = await manageEmployeeUseCase.findSalaryHistory('emp-1');
      expect(result).toHaveLength(1);
    });
  });
});
