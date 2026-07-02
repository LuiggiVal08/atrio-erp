export class DashboardWidget {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly config: Record<string, any>,
    public readonly positionX: number,
    public readonly positionY: number,
    public readonly width: number,
    public readonly height: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
