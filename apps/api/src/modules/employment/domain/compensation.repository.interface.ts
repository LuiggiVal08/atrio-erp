import { CompensationAgreement, CreateCompensationData } from './compensation.entity';
import { EmploymentReason } from './employment-relationship.entity';

export interface CompensationRepository {
  create(data: CreateCompensationData): Promise<CompensationAgreement>;
  findById(id: string): Promise<CompensationAgreement | null>;
  findCurrentAt(relationshipId: string, effectiveDate: Date): Promise<CompensationAgreement | null>;
  findByRelationship(relationshipId: string): Promise<CompensationAgreement[]>;
  findOverlapping(
    relationshipId: string, effectiveDate: Date, excludeAgreementId?: string,
  ): Promise<CompensationAgreement[]>;
}
