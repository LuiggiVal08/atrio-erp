import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

describe('Payroll payslip PDF template', () => {
  it('renders receipt totals and escapes employee-provided text', () => {
    const templatePath = path.resolve(
      __dirname,
      '../../../src/modules/reports/infrastructure/templates/payroll-payslip.hbs',
    );
    const render = Handlebars.compile(fs.readFileSync(templatePath, 'utf8'));

    const html = render({
      employeeName: '<script>alert(1)</script>',
      employeeNumber: 'V-12345678',
      departmentName: 'Sales',
      positionName: 'Advisor',
      periodLabel: '01/11/2026 – 15/11/2026',
      generatedAt: '02/11/2026',
      baseSalary: 'USD 1,000.00',
      totalEarnings: 'USD 1,200.00',
      totalDeductions: 'USD 100.00',
      netPay: 'USD 1,100.00',
      lines: [{ description: 'Commission', type: 'Asignación', amount: 'USD 200.00' }],
    });

    expect(html).toContain('USD 1,100.00');
    expect(html).toContain('USD 1,200.00');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
