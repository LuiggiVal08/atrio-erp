import { CompensationRepository } from '../domain/compensation.repository.interface';
import { type CompensationAgreement, type CreateCompensationData, type AdjustCompensationData } from '../domain/compensation.entity';
import { EmploymentRepository } from '../domain/employment.repository.interface';

export class ManageCompensationUseCase {
  constructor(
    private readonly compensationRepository: CompensationRepository,
    private readonly employmentRepository: EmploymentRepository,
  ) {}

  async create(data: CreateCompensationData): Promise<CompensationAgreement> {
    const rel = await this.employmentRepository.findById(data.relationshipId);
    if (!rel) throw new Error('Employment relationship not found');

    for (const c of data.components) {
      if (c.amount <= 0) throw new Error('Amount must be greater than 0');
    }

    const effectiveDate = new Date(data.effectiveDate);
    const overlapping = await this.compensationRepository.findOverlapping(data.relationshipId, effectiveDate);
    if (overlapping.length > 0) throw new Error('Cannot create — an active compensation agreement already exists for this date');

    const agreement = await this.compensationRepository.create(data);

    await this.employmentRepository.addChange({
      relationshipId: data.relationshipId,
      changeType: 'COMPENSATION_CHANGED',
      reason: 'OTHER',
      newValue: {
        agreementId: agreement.id,
        components: data.components.map(c => ({ type: c.type, amount: c.amount })),
        effectiveDate: data.effectiveDate,
      } as any,
      changedBy: (data as any).changedBy,
    });

    return agreement;
  }

  async adjust(data: AdjustCompensationData): Promise<CompensationAgreement> {
    const rel = await this.employmentRepository.findById(data.relationshipId);
    if (!rel) throw new Error('Employment relationship not found');

    for (const c of data.components) {
      if (c.amount <= 0) throw new Error('Amount must be greater than 0');
    }

    const previous = await this.compensationRepository.findById(data.previousAgreementId);
    if (!previous) throw new Error('Previous agreement not found');
    if (previous.relationshipId !== data.relationshipId) {
      throw new Error('Previous agreement does not belong to this relationship');
    }

    return this.compensationRepository.adjustVersion(data);
  }

  async findCurrent(relationshipId: string): Promise<CompensationAgreement | null> {
    return this.compensationRepository.findCurrentAt(relationshipId, new Date());
  }

  async findCurrentAt(relationshipId: string, effectiveDate: string): Promise<CompensationAgreement | null> {
    return this.compensationRepository.findCurrentAt(relationshipId, new Date(effectiveDate));
  }

  async findHistory(relationshipId: string): Promise<CompensationAgreement[]> {
    return this.compensationRepository.findByRelationship(relationshipId);
  }

  async findById(id: string): Promise<CompensationAgreement> {
    const agreement = await this.compensationRepository.findById(id);
    if (!agreement) throw new Error('Compensation agreement not found');
    return agreement;
  }
}
