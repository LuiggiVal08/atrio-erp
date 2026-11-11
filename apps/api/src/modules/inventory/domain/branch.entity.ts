export class Branch {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly code: string | null,
    public readonly address: string | null,
    public readonly phone: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}
