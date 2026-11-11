export class CustomerSnapshot {
  constructor(
    public readonly partnerId: string,
    public readonly name: string,
    public readonly taxId: string | null,
    public readonly address: string | null,
    public readonly email: string | null,
    public readonly phone: string | null,
  ) {
    if (!partnerId) throw new Error('partnerId is required');
    if (!name || name.trim().length === 0) throw new Error('Customer name is required');
  }

  update(partial: { name?: string; taxId?: string | null; address?: string | null; email?: string | null; phone?: string | null }): CustomerSnapshot {
    return new CustomerSnapshot(
      this.partnerId,
      partial.name ?? this.name,
      partial.taxId !== undefined ? partial.taxId : this.taxId,
      partial.address !== undefined ? partial.address : this.address,
      partial.email !== undefined ? partial.email : this.email,
      partial.phone !== undefined ? partial.phone : this.phone,
    );
  }
}
