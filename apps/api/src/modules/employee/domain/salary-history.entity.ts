export class SalaryHistory {
  constructor(
    public readonly id: string,
    public readonly employeeId: string,
    public readonly salary: number,
    public readonly effectiveDate: Date,
    public readonly reason: string | null,
    public readonly createdAt: Date,
  ) {}
}
