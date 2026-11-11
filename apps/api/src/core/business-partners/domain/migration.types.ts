export type MatchConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type MatchCriteria = 'TAX_ID' | 'EMAIL' | 'PHONE' | 'NAME' | 'MANUAL';

export interface NormalizationChange {
  field: string;
  from: string | null;
  to: string | null;
  reason: string;
}

export interface LegacyClient {
  id: string;
  tenantId: string;
  documentId: string;
  identificationType?: string | null;
  legalName: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  secondLastName?: string | null;
  taxId: string;
  email?: string | null;
  phone?: string | null;
  addressId?: string | null;
  contributorType?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface LegacyVendor {
  id: string;
  tenantId: string;
  documentId: string;
  identificationType?: string | null;
  legalName: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  secondLastName?: string | null;
  taxId: string;
  email?: string | null;
  phone?: string | null;
  addressId?: string | null;
  contactFirstName?: string | null;
  contactMiddleName?: string | null;
  contactLastName?: string | null;
  contactSecondLastName?: string | null;
  contactIdentificationType?: string | null;
  contactIdentificationNumber?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type LegacyRecord = LegacyClient | LegacyVendor;

export interface NormalizedPartner {
  tenantId: string;
  type: 'PERSON' | 'COMPANY';
  legalName: string;
  taxIdValue?: string | null;
  taxIdCountry?: string | null;
  taxIdType?: string | null;
  commercialName?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  metadataSource?: string | null;
  metadataNotes?: string | null;
  externalId?: string | null;
  legacyType: 'client' | 'vendor';
  legacyId: string;
  changes: NormalizationChange[];
}

export interface NormalizedContact {
  partnerLegacyType: 'client' | 'vendor';
  partnerLegacyId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

export interface ValidationResult {
  record: NormalizedPartner;
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface MatchResult {
  matchedPartnerId?: string;
  matchConfidence: MatchConfidence;
  matchedBy: MatchCriteria | null;
  normalized: NormalizedPartner;
  contacts: NormalizedContact[];
}

export interface MatchDistribution {
  byTaxId: number;
  byEmail: number;
  byPhone: number;
  byName: number;
  byManual: number;
}

export interface MigrationReport {
  batchId: string;
  clientsRead: number;
  vendorsRead: number;
  partnersCreated: number;
  rolesCustomer: number;
  rolesSupplier: number;
  autoMerged: number;
  manualReview: number;
  errors: number;
  warnings: number;
  elapsedMs: number;
  startTime: string;
  endTime: string;
  matchDistribution: MatchDistribution;
  normalizationChanges: NormalizationChange[];
}

export interface MigrationBatch {
  batchId: string;
  startedAt: Date;
  report: MigrationReport;
}
