import { Client } from './client.entity';
import { Vendor } from './vendor.entity';

export type UpdateClientData = Partial<Omit<Client, 'id' | 'tenantId' | 'createdAt'>> & {
  tenantId?: string;
  updatedById?: string;
};

export interface VendorAddressInput {
  country: string;
  state: string;
  city: string;
  addressLine: string;
  reference?: string;
}

export type UpdateVendorData = Partial<Omit<Vendor, 'id' | 'tenantId' | 'createdAt' | 'contacts'>> & {
  tenantId?: string;
  updatedById?: string;
  contacts?: UpdateVendorContactData[];
  address?: VendorAddressInput;
  ownerIsPrimary?: boolean;
};

export interface CreateClientData {
  tenantId: string;
  createdById?: string;
  documentId: string;
  identificationType?: string;
  legalName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  secondLastName?: string;
  taxId: string;
  email?: string;
  phone?: string;
  addressId?: string;
  contributorType?: string;
}

export interface CreateVendorContactData {
  fullName: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  identificationType?: string;
  identificationNumber?: string;
  isPrimary?: boolean;
}

export interface UpdateVendorContactData extends CreateVendorContactData {
  id?: string;
}

export interface CreateVendorData {
  tenantId: string;
  createdById?: string;
  documentId: string;
  identificationType?: string;
  legalName: string;
  /** Datos del dueño: se persisten como contacto con position "Dueño". */
  firstName?: string;
  middleName?: string;
  lastName?: string;
  secondLastName?: string;
  taxId: string;
  /** Email del dueño (contacto "Dueño"). */
  email?: string;
  /** Teléfono del dueño (contacto "Dueño"). */
  phone?: string;
  addressId?: string;
  /** Dirección fiscal del proveedor (PartnerAddress type FISCAL). */
  address?: VendorAddressInput;
  /** Si el contacto "Dueño" es además el contacto principal. */
  ownerIsPrimary?: boolean;
  commercialName?: string;
  website?: string;
  metadataNotes?: string;
  paymentTerms?: string;
  deliveryDays?: number;
  categoryTags?: string[];
  categoryIds?: string[];
  contacts?: CreateVendorContactData[];
  contactFirstName?: string;
  contactMiddleName?: string;
  contactLastName?: string;
  contactSecondLastName?: string;
  contactIdentificationType?: string;
  contactIdentificationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface ClientVendorRepository {
  createClient(data: CreateClientData): Promise<Client>;
  findAllClients(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Client[]>;
  findClientById(id: string): Promise<Client | null>;
  updateClient(id: string, data: UpdateClientData): Promise<Client>;
  softDeleteClient(id: string, deletedById?: string): Promise<void>;

  createVendor(data: CreateVendorData): Promise<Vendor>;
  findAllVendors(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Vendor[]>;
  findVendorsByCategory(tenantId: string, categoryId: string): Promise<Vendor[]>;
  findVendorById(id: string): Promise<Vendor | null>;
  updateVendor(id: string, data: UpdateVendorData): Promise<Vendor>;
  softDeleteVendor(id: string, deletedById?: string): Promise<void>;
}
