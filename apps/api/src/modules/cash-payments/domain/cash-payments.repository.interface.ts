import { CashRegister } from './cash-register.entity';
import { PaymentMethod } from './payment-method.entity';
import { CashMovement } from './cash-movement.entity';
import { BankAccount } from './bank-account.entity';

export interface CashPaymentsRepository {
  createRegister(data: { tenantId: string; name: string; currency: string }): Promise<CashRegister>;
  findAllRegisters(tenantId: string): Promise<CashRegister[]>;
  findRegisterById(id: string): Promise<CashRegister | null>;
  updateRegisterBalance(id: string, delta: number): Promise<CashRegister>;
  softDeleteRegister(id: string): Promise<void>;

  createPaymentMethod(data: { tenantId: string; name: string; type: string }): Promise<PaymentMethod>;
  findAllPaymentMethods(tenantId: string): Promise<PaymentMethod[]>;
  deletePaymentMethod(id: string): Promise<void>;

  createMovement(data: {
    cashRegisterId: string; type: 'in' | 'out'; amount: number;
    referenceType?: string; referenceId?: string; description?: string; userId: string;
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
