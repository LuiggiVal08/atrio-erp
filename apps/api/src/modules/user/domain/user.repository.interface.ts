import { User } from './user.entity';

export interface CreateUserData {
  tenantId: string;
  email: string;
  passwordHash: string;
  name: string;
  employeeId?: string;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByTenant(tenantId: string): Promise<User[]>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
}
