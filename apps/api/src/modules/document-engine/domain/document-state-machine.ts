import { DocumentStatus } from './document.entity';

export interface Transition {
  from: DocumentStatus;
  to: DocumentStatus;
  action: string;
}

export interface StateMachineConfig {
  transitions: Transition[];
}

const DEFAULT_TRANSITIONS: Transition[] = [
  { from: DocumentStatus.DRAFT, to: DocumentStatus.PENDING_APPROVAL, action: 'submit' },
  { from: DocumentStatus.PENDING_APPROVAL, to: DocumentStatus.DRAFT, action: 'reject' },
  { from: DocumentStatus.PENDING_APPROVAL, to: DocumentStatus.APPROVED, action: 'approve' },
  { from: DocumentStatus.APPROVED, to: DocumentStatus.DELIVERED, action: 'deliver' },
  { from: DocumentStatus.APPROVED, to: DocumentStatus.PAID, action: 'pay' },
  { from: DocumentStatus.APPROVED, to: DocumentStatus.CANCELLED, action: 'cancel' },
  { from: DocumentStatus.DELIVERED, to: DocumentStatus.PAID, action: 'pay' },
  { from: DocumentStatus.PAID, to: DocumentStatus.CANCELLED, action: 'cancel' },
  { from: DocumentStatus.DRAFT, to: DocumentStatus.CANCELLED, action: 'cancel' },
  { from: DocumentStatus.PENDING_APPROVAL, to: DocumentStatus.CANCELLED, action: 'cancel' },
];

export class DocumentStateMachine {
  private config: StateMachineConfig;

  constructor(config?: StateMachineConfig) {
    this.config = config || { transitions: DEFAULT_TRANSITIONS };
  }

  getTransitions(): Transition[] {
    return [...this.config.transitions];
  }

  getValidNextStatuses(currentStatus: DocumentStatus): DocumentStatus[] {
    return this.config.transitions
      .filter((t) => t.from === currentStatus)
      .map((t) => t.to);
  }

  canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
    return this.config.transitions.some(
      (t) => t.from === from && t.to === to,
    );
  }

  getAction(from: DocumentStatus, to: DocumentStatus): string | undefined {
    return this.config.transitions.find(
      (t) => t.from === from && t.to === to,
    )?.action;
  }

  transition(from: DocumentStatus, to: DocumentStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid transition: ${from} → ${to}. Valid transitions from ${from}: [${this.getValidNextStatuses(from).join(', ')}]`,
      );
    }
  }
}
