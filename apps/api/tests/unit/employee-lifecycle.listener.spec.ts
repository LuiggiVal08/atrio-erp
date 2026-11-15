import { EmployeeLifecycleListener } from '../../src/modules/employment/infrastructure/employee-lifecycle.listener';

describe('EmployeeLifecycleListener', () => {
  const relationship = (id: string, status: string, tenantId = 't1') => ({
    id,
    tenantId,
    employeeId: 'emp-1',
    status,
    startDate: new Date('2026-01-01'),
    endDate: null,
  });

  it('terminates active employment and ends the current assignment at deactivation', async () => {
    const employmentRepository = {
      findByEmployee: jest.fn().mockResolvedValue([relationship('rel-1', 'ACTIVE')]),
    };
    const positionRepository = {
      findCurrentAssignment: jest.fn().mockResolvedValue({ id: 'asg-1', tenantId: 't1', endDate: null }),
      endAssignment: jest.fn().mockResolvedValue({ id: 'asg-1' }),
    };
    const manageEmployment = { terminate: jest.fn().mockResolvedValue({ id: 'rel-1' }) };
    const listener = new EmployeeLifecycleListener(
      employmentRepository as any,
      positionRepository as any,
      manageEmployment as any,
    );

    await listener.handleDeactivated({ employeeId: 'emp-1', tenantId: 't1', effectiveDate: '2026-11-14' });

    expect(manageEmployment.terminate).toHaveBeenCalledWith('rel-1', '2026-11-14', 'OTHER', 'system');
    expect(positionRepository.endAssignment).toHaveBeenCalledWith('asg-1', '2026-11-14');
  });

  it('ignores already terminated relationships, foreign tenants and ended assignments', async () => {
    const employmentRepository = {
      findByEmployee: jest.fn().mockResolvedValue([
        relationship('rel-done', 'TERMINATED'),
        relationship('rel-foreign', 'ACTIVE', 't2'),
      ]),
    };
    const positionRepository = {
      findCurrentAssignment: jest.fn().mockResolvedValue({ id: 'asg-1', tenantId: 't2', endDate: null }),
      endAssignment: jest.fn(),
    };
    const manageEmployment = { terminate: jest.fn() };
    const listener = new EmployeeLifecycleListener(
      employmentRepository as any,
      positionRepository as any,
      manageEmployment as any,
    );

    await listener.handleDeactivated({ employeeId: 'emp-1', tenantId: 't1' });

    expect(manageEmployment.terminate).not.toHaveBeenCalled();
    expect(positionRepository.endAssignment).not.toHaveBeenCalled();
  });
});
