export class Client {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly legalName: string,
    public readonly taxId: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly address: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
