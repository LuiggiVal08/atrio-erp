import type {
  Partner,
  PartnerWithRelations,
  PartnerSummary,
  PartnerType,
  PartnerStatus,
  PartnerRoleType,
  AddressType,
  TaxIdentifier,
} from './partner.entity';

export interface CreatePartnerData {
  tenantId: string;
  type: PartnerType;
  legalName: string;
  taxId?: TaxIdentifier | null;
  commercialName?: string | null;
  website?: string | null;
  paymentTerms?: string | null;
  deliveryDays?: number | null;
  status?: PartnerStatus;
  metadataSource?: string | null;
  metadataNotes?: string | null;
  externalId?: string | null;
  createdById: string;
  updatedById: string;
  roles?: PartnerRoleType[];
  tags?: string[];
  categoryIds?: string[];
}

export interface UpdatePartnerData {
  type?: PartnerType;
  legalName?: string;
  taxId?: TaxIdentifier | null;
  commercialName?: string | null;
  website?: string | null;
  paymentTerms?: string | null;
  deliveryDays?: number | null;
  status?: PartnerStatus;
  metadataSource?: string | null;
  metadataNotes?: string | null;
  externalId?: string | null;
  categoryIds?: string[];
  updatedById: string;
}

export interface PartnerFilters {
  tenantId: string;
  search?: string;
  roles?: PartnerRoleType[];
  types?: PartnerType[];
  statuses?: PartnerStatus[];
  tags?: string[];
  categoryIds?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: 'legalName' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateContactData {
  partnerId: string;
  fullName: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  isPrimary?: boolean;
  createdById: string;
  updatedById: string;
}

export interface UpdateContactData {
  fullName?: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  isPrimary?: boolean;
  updatedById: string;
}

export interface CreateAddressData {
  partnerId: string;
  type: AddressType;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  isPrimary?: boolean;
  createdById: string;
  updatedById: string;
}

export interface UpdateAddressData {
  type?: AddressType;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string | null;
  isPrimary?: boolean;
  updatedById: string;
}

export const PARTNER_REPOSITORY = 'PARTNER_REPOSITORY';

export interface PartnerRepository {
  create(data: CreatePartnerData): Promise<Partner>;
  findById(id: string): Promise<PartnerWithRelations | null>;
  findMany(filters: PartnerFilters): Promise<PaginatedResult<PartnerSummary>>;
  update(id: string, data: UpdatePartnerData): Promise<Partner>;
  softDelete(id: string, updatedById: string): Promise<void>;
  restore(id: string, updatedById: string): Promise<Partner>;
  assignRole(partnerId: string, role: PartnerRoleType): Promise<void>;
  removeRole(partnerId: string, role: PartnerRoleType): Promise<void>;
  addTags(partnerId: string, tags: string[]): Promise<void>;
  removeTags(partnerId: string, tags: string[]): Promise<void>;
  addContact(data: CreateContactData): Promise<{ id: string }>;
  updateContact(id: string, data: UpdateContactData): Promise<void>;
  softDeleteContact(id: string): Promise<void>;
  addAddress(data: CreateAddressData): Promise<{ id: string }>;
  updateAddress(id: string, data: UpdateAddressData): Promise<void>;
  softDeleteAddress(id: string): Promise<void>;
  addEvent(partnerId: string, eventType: string, payload: Record<string, unknown>, createdById: string): Promise<void>;
  findEvents(partnerId: string): Promise<{ id: string; eventType: string; payload: Record<string, unknown>; occurredAt: Date }[]>;
  findByTaxId(tenantId: string, taxId: TaxIdentifier): Promise<Partner | null>;
}
