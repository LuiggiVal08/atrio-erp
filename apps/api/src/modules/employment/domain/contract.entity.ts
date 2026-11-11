export type ContractType = 'FULL_TIME' | 'PART_TIME' | 'FIXED_TERM' | 'TEMPORARY' | 'INTERNSHIP' | 'PROBATION';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'CANCELLED';

export type ContractReason =
  | 'RENEWAL' | 'EXPIRATION' | 'LEGAL_UPDATE' | 'CORRECTION'
  | 'TERMINATION' | 'CANCELLATION' | 'NEW_HIRE' | 'TRANSFER' | 'OTHER';

export function computeContractStatus(contract: {
  startDate: Date; endDate: Date | null; terminatedAt: Date | null;
}, referenceDate: Date = new Date()): ContractStatus {
  if (contract.terminatedAt) return 'TERMINATED';
  if (contract.startDate > referenceDate) return 'DRAFT';
  if (contract.endDate && contract.endDate < referenceDate) return 'EXPIRED';
  return 'ACTIVE';
}

export interface Contract {
  id: string;
  relationshipId: string;
  contractType: ContractType;
  status: ContractStatus;
  startDate: Date;
  endDate: Date | null;
  terminatedAt: Date | null;
  renewedFromContractId: string | null;
  reason: ContractReason | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContractData {
  relationshipId: string;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  renewedFromContractId?: string;
  reason?: ContractReason;
  metadata?: Record<string, unknown>;
}

export interface RenewContractData {
  relationshipId: string;
  previousContractId: string;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  reason?: ContractReason;
  metadata?: Record<string, unknown>;
}

export interface TerminateContractData {
  contractId: string;
  terminatedAt: string;
  reason: ContractReason;
}
