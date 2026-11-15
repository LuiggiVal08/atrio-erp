export class Vendor {
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
    public readonly contactFirstName: string | null,
    public readonly contactMiddleName: string | null,
    public readonly contactLastName: string | null,
    public readonly contactSecondLastName: string | null,
    public readonly contactIdentificationType: string | null,
    public readonly contactIdentificationNumber: string | null,
    public readonly contactEmail: string | null,
    public readonly contactPhone: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
    public readonly commercialName: string | null = null,
    public readonly website: string | null = null,
    public readonly paymentTerms: string | null = null,
    public readonly deliveryDays: number | null = null,
    public readonly metadataNotes: string | null = null,
    public readonly categoryTags: string[] = [],
    public readonly categoryIds: string[] = [],
    public readonly categories: { id: string; name: string }[] = [],
    public readonly contacts: VendorContact[] = [],
    public readonly address: VendorAddress | null = null,
  ) {}
}

export interface VendorAddress {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  isPrimary: boolean;
}

export interface VendorContact {
  id: string;
  fullName: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  isPrimary: boolean;
}
