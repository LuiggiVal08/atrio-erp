export type UserStatus = 'active' | 'blocked' | 'inactive';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  name: string;
  imageUrl?: string | null;
  phone?: string | null;
  status: UserStatus;
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
  lastLoginAt?: Date | null;
  employeeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
