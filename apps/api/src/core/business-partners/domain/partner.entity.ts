export type PartnerType = 'PERSON' | 'COMPANY';
export type PartnerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'ARCHIVED';
export type PartnerRoleType = 'CUSTOMER' | 'SUPPLIER' | 'PROSPECT' | 'DISTRIBUTOR' | 'CARRIER' | 'MANUFACTURER' | 'CREDITOR';
export type AddressType = 'FISCAL' | 'BILLING' | 'SHIPPING' | 'BRANCH' | 'PRIMARY' | 'OTHER';

export interface TaxIdentifier {
  value: string;
  country: string;
  type: string;
}

export interface Partner {
  id: string;
  tenantId: string;
  type: PartnerType;
  legalName: string;
  taxId?: TaxIdentifier | null;
  commercialName?: string | null;
  website?: string | null;
  paymentTerms?: string | null;
  deliveryDays?: number | null;
  status: PartnerStatus;
  metadataSource?: string | null;
  metadataNotes?: string | null;
  externalId?: string | null;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface PartnerWithRelations extends Partner {
  roles: PartnerRoleRelation[];
  tags: PartnerTagRelation[];
  categories?: PartnerCategoryRelation[];
  contacts: ContactRelation[];
  addresses: AddressRelation[];
}

export interface PartnerRoleRelation {
  role: PartnerRoleType;
  assignedAt: Date;
}

export interface PartnerTagRelation {
  value: string;
}

export interface PartnerCategoryRelation {
  categoryId: string;
  name: string;
}

export interface ContactRelation {
  id: string;
  fullName: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  isPrimary: boolean;
  deletedAt?: Date | null;
}

export interface AddressRelation {
  id: string;
  type: AddressType;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  isPrimary: boolean;
  deletedAt?: Date | null;
}

export interface PartnerSummary {
  id: string;
  type: PartnerType;
  legalName: string;
  commercialName?: string | null;
  taxId?: TaxIdentifier | null;
  status: PartnerStatus;
  roles: PartnerRoleType[];
  tags: string[];
  categories?: { categoryId: string; name: string }[];
  primaryContact?: { fullName: string; email?: string | null; phone?: string | null } | null;
  createdAt: Date;
}
