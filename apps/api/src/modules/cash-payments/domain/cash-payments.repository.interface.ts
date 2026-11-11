import { CashRegister } from './cash-register.entity';
import { PaymentMethod } from './payment-method.entity';
import { CashMovement } from './cash-movement.entity';
import { BankAccount } from './bank-account.entity';

export interface CashPaymentsRepository {
  createRegister(data: { tenantId: string; name: string; location?: string; currency: string }): Promise<CashRegister>;
  findAllRegisters(tenantId: string): Promise<CashRegister[]>;
  findRegisterById(id: string): Promise<CashRegister | null>;
  updateRegisterBalance(id: string, delta: number): Promise<CashRegister>;
  softDeleteRegister(id: string): Promise<void>;

  createPaymentMethod(data: { tenantId: string; name: string; type: string; currency?: string; commissionRate?: number }): Promise<PaymentMethod>;
  findAllPaymentMethods(tenantId: string): Promise<PaymentMethod[]>;
  updatePaymentMethod(id: string, tenantId: string, data: Partial<{
    name: string;
    type: string;
    currency: string;
    commissionRate: number | null;
    isActive: boolean;
  }>): Promise<PaymentMethod | null>;
  deletePaymentMethod(id: string): Promise<void>;

  createMovement(data: {
    cashRegisterId: string; type: 'in' | 'out'; amount: number;
    currency?: string; exchangeRate?: number; baseAmount?: number;
    paymentMethod?: string; sessionId?: string;
    referenceType?: string; referenceId?: string; description?: string; userId: string;
    category?: string; receiptName?: string;
  }): Promise<CashMovement>;
  findMovements(cashRegisterId: string): Promise<CashMovement[]>;

  // Bank Accounts
  createBankAccount(data: {
    tenantId: string; name: string; accountNumber: string; bankName: string;
    accountType: string; currency?: string;
  }): Promise<BankAccount>;
  findAllBankAccounts(tenantId: string): Promise<BankAccount[]>;
  findBankAccountById(id: string): Promise<BankAccount | null>;
  updateBankAccount(id: string, data: Partial<{ name: string; isActive: boolean; balance: number }>): Promise<BankAccount>;
  deleteBankAccount(id: string): Promise<void>;
}
