export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export interface Tenant {
  id: string;
  legalName: string;
  taxId: string;
  baseCurrency: string;
  timezone: string;
  subscriptionPlan: SubscriptionPlan;
  status: TenantStatus;
  settings?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
