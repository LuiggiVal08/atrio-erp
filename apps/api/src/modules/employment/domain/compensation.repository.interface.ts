import { CompensationAgreement, CreateCompensationData, AdjustCompensationData } from './compensation.entity';

export interface CompensationRepository {
  create(data: CreateCompensationData): Promise<CompensationAgreement>;
  adjustVersion(data: AdjustCompensationData): Promise<CompensationAgreement>;
  findById(id: string): Promise<CompensationAgreement | null>;
  findCurrentAt(relationshipId: string, effectiveDate: Date): Promise<CompensationAgreement | null>;
  findByRelationship(relationshipId: string): Promise<CompensationAgreement[]>;
  findOverlapping(
    relationshipId: string, effectiveDate: Date, excludeAgreementId?: string,
  ): Promise<CompensationAgreement[]>;
}
