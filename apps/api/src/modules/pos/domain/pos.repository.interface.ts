import { PosSession } from './pos-session.entity';

export interface PosRepository {
  createSession(data: {
    tenantId: string; cashRegisterId: string; userId: string; openingBalance: number;
  }): Promise<PosSession>;
  findSessionById(id: string): Promise<PosSession | null>;
  findOpenSession(tenantId: string, cashRegisterId: string): Promise<PosSession | null>;
  findSessionsByTenant(tenantId: string): Promise<PosSession[]>;
  closeSession(id: string, closingBalance: number): Promise<PosSession>;
}
