import { ContractRepository } from '../domain/contract.repository.interface';
import { type Contract, type CreateContractData, type RenewContractData } from '../domain/contract.entity';
import { EmploymentRepository } from '../domain/employment.repository.interface';

export class ManageContractUseCase {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly employmentRepository: EmploymentRepository,
  ) {}

  async create(data: CreateContractData): Promise<Contract> {
    const rel = await this.employmentRepository.findById(data.relationshipId);
    if (!rel) throw new Error('Employment relationship not found');

    const overlapping = await this.contractRepository.findOverlapping(
      data.relationshipId, new Date(data.startDate), data.endDate ? new Date(data.endDate) : null,
    );
    if (overlapping.length > 0) throw new Error('Overlapping contracts are not allowed');

    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const contract = await this.contractRepository.create(data);

    await this.employmentRepository.addChange({
      relationshipId: data.relationshipId,
      changeType: 'CONTRACT_CREATED',
      reason: (data.reason as any) || 'OTHER',
      newValue: { contractId: contract.id, contractType: data.contractType, startDate: data.startDate } as any,
      changedBy: (data as any).changedBy,
    });

    return contract;
  }

  async renew(data: RenewContractData): Promise<Contract> {
    const rel = await this.employmentRepository.findById(data.relationshipId);
    if (!rel) throw new Error('Employment relationship not found');

    const previous = await this.contractRepository.findById(data.previousContractId);
    if (!previous) throw new Error('Previous contract not found');
    if (previous.relationshipId !== data.relationshipId) throw new Error('Previous contract does not belong to this relationship');

    const overlapping = await this.contractRepository.findOverlapping(
      data.relationshipId, new Date(data.startDate), data.endDate ? new Date(data.endDate) : null,
    );
    if (overlapping.length > 0) throw new Error('Overlapping contracts are not allowed');

    const contract = await this.contractRepository.create({
      relationshipId: data.relationshipId,
      contractType: data.contractType,
      startDate: data.startDate,
      endDate: data.endDate,
      renewedFromContractId: data.previousContractId,
      reason: data.reason,
      metadata: data.metadata,
    });

    await this.employmentRepository.addChange({
      relationshipId: data.relationshipId,
      changeType: 'CONTRACT_RENEWED',
      reason: (data.reason as any) || 'OTHER',
      previousValue: { contractId: previous.id, contractType: previous.contractType } as any,
      newValue: { contractId: contract.id, contractType: data.contractType, startDate: data.startDate } as any,
      changedBy: (data as any).changedBy,
    });

    return contract;
  }

  async terminate(contractId: string, terminatedAt: string, reason: string, changedBy?: string): Promise<Contract> {
    const contract = await this.contractRepository.findById(contractId);
    if (!contract) throw new Error('Contract not found');
    if (contract.terminatedAt) throw new Error('Contract is already terminated');

    const result = await this.contractRepository.terminate({ contractId, terminatedAt, reason: reason as any });

    await this.employmentRepository.addChange({
      relationshipId: contract.relationshipId,
      changeType: 'CONTRACT_TERMINATED',
      reason: reason as any,
      previousValue: { contractId, terminatedAt: null } as any,
      newValue: { contractId, terminatedAt } as any,
      changedBy: changedBy ?? 'system',
    });

    return result;
  }

  async findCurrent(relationshipId: string, effectiveDate?: string): Promise<Contract | null> {
    return this.contractRepository.findCurrentAt(relationshipId, effectiveDate ? new Date(effectiveDate) : undefined);
  }

  async findHistory(relationshipId: string): Promise<Contract[]> {
    return this.contractRepository.findByRelationship(relationshipId);
  }

  async findById(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) throw new Error('Contract not found');
    return contract;
  }
}
