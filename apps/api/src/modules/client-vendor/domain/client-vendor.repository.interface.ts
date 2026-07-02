import { Client } from './client.entity';
import { Vendor } from './vendor.entity';

export interface ClientVendorRepository {
  // Clients
  createClient(data: {
    tenantId: string; legalName: string; taxId: string;
    email?: string; phone?: string; address?: string;
  }): Promise<Client>;
  findAllClients(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Client[]>;
  findClientById(id: string): Promise<Client | null>;
  updateClient(id: string, data: Partial<Omit<Client, 'id' | 'tenantId' | 'createdAt'>>): Promise<Client>;
  softDeleteClient(id: string): Promise<void>;

  // Vendors
  createVendor(data: {
    tenantId: string; legalName: string; taxId: string;
    email?: string; phone?: string; address?: string;
  }): Promise<Vendor>;
  findAllVendors(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Vendor[]>;
  findVendorById(id: string): Promise<Vendor | null>;
  updateVendor(id: string, data: Partial<Omit<Vendor, 'id' | 'tenantId' | 'createdAt'>>): Promise<Vendor>;
  softDeleteVendor(id: string): Promise<void>;
}
