export class PositionAssignment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly employeeId: string,
    public readonly positionId: string,
    public readonly startDate: Date,
    public readonly endDate: Date | null,
    public readonly createdAt: Date,
  ) {}
}
