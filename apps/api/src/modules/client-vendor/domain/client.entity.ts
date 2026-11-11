export class Client {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly documentId: string,
    public readonly identificationType: string | null,
    public readonly legalName: string,
    public readonly firstName: string | null,
    public readonly middleName: string | null,
    public readonly lastName: string | null,
    public readonly secondLastName: string | null,
    public readonly taxId: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly addressId: string | null,
    public readonly contributorType: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
