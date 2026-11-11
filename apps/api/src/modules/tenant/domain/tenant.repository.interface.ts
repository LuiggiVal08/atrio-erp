import { Tenant, SubscriptionPlan } from './tenant.entity';

export interface CreateTenantData {
  slug: string;
  legalName: string;
  taxId: string;
  baseCurrency?: string;
  timezone?: string;
  subscriptionPlan?: SubscriptionPlan;
  adminEmail: string;
  adminName: string;
}

export interface UpdateTenantData {
  legalName?: string;
  baseCurrency?: string;
  timezone?: string;
  subscriptionPlan?: string;
  status?: string;
}

export interface CreateTenantWithAdminResult {
  tenant: Tenant;
  adminUser: { id: string; email: string; tenantId: string };
}

export interface TenantRepository {
  create(data: CreateTenantData): Promise<CreateTenantWithAdminResult>;
  findById(id: string): Promise<Tenant | null>;
  findAll(): Promise<Tenant[]>;
  update(id: string, data: UpdateTenantData): Promise<Tenant>;
}
