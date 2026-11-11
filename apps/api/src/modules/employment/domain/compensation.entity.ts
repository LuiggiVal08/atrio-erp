export type CompensationType = 'SALARY' | 'BONUS' | 'ALLOWANCE' | 'COMMISSION';

export interface CompensationComponent {
  id: string;
  agreementId: string;
  type: CompensationType;
  amount: number;
  createdAt: Date;
}

export interface CompensationAgreement {
  id: string;
  relationshipId: string;
  effectiveDate: Date;
  endedAt: Date | null;
  currency: string;
  components: CompensationComponent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompensationComponentData {
  type: CompensationType;
  amount: number;
}

export interface CreateCompensationData {
  relationshipId: string;
  effectiveDate: string;
  currency?: string;
  components: CreateCompensationComponentData[];
}

export interface AdjustCompensationData {
  relationshipId: string;
  previousAgreementId: string;
  effectiveDate: string;
  currency?: string;
  components: CreateCompensationComponentData[];
}
