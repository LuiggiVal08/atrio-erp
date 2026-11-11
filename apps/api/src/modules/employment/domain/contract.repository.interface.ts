import { Contract, CreateContractData, TerminateContractData } from './contract.entity';

export interface ContractRepository {
  create(data: CreateContractData): Promise<Contract>;
  findById(id: string): Promise<Contract | null>;
  findCurrentAt(relationshipId: string, effectiveDate?: Date): Promise<Contract | null>;
  findByRelationship(relationshipId: string): Promise<Contract[]>;
  findOverlapping(relationshipId: string, startDate: Date, endDate: Date | null, excludeContractId?: string): Promise<Contract[]>;
  terminate(data: TerminateContractData): Promise<Contract>;
}
