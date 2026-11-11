import { PayrollController } from '../../../src/modules/payroll/infrastructure/payroll.controller';
import { ManagePayrollUseCase } from '../../../src/modules/payroll/application/manage-payroll.use-case';
import { PdfGeneratorService } from '../../../src/modules/reports/infrastructure/pdf-generator.service';

describe('PayrollController receipt download', () => {
  const period = {
    id: 'period-1',
    tenantId: 'tenant-1',
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2026-11-15T00:00:00.000Z'),
  };
  const payslip = {
    id: 'payslip-1',
    periodId: period.id,
    tenantId: period.tenantId,
    employeeName: 'Test employee',
    employeeNumber: 'V-12345678',
    departmentName: 'Sales',
    positionName: 'Advisor',
    currency: 'USD',
    baseSalary: 1000,
    baseEarnings: 1000,
    otherEarnings: 200,
    totalDeductions: 100,
    netPay: 1100,
    lines: [],
  };

  it('generates and returns an attachment after tenant-scoped payslip lookup', async () => {
    const useCase = {
      findPayslipById: jest.fn().mockResolvedValue(payslip),
      findPeriodById: jest.fn().mockResolvedValue(period),
    } as unknown as ManagePayrollUseCase;
    const pdf = Buffer.from('%PDF');
    const generator = { generate: jest.fn().mockResolvedValue(pdf) } as unknown as PdfGeneratorService;
    const controller = new PayrollController(useCase, generator);
    const response = {
      type: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await controller.downloadPayslipReceipt('payslip-1', { id: 'user-1', tenantId: 'tenant-1' }, response as never);

    expect(useCase.findPayslipById).toHaveBeenCalledWith('payslip-1', 'tenant-1');
    expect(generator.generate).toHaveBeenCalledWith('payroll-payslip', expect.objectContaining({
      employeeName: 'Test employee',
      netPay: expect.stringContaining('1.100,00'),
    }));
    expect(response.type).toHaveBeenCalledWith('application/pdf');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="payslip-payslip-1.pdf"',
    );
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(response.send).toHaveBeenCalledWith(pdf);
  });
});
