export interface StateMachine<T extends string> {
  readonly transitions: Record<T, T[]>;
  canTransition(from: T, to: T): boolean;
  assertValidTransition(from: T, to: T): void;
  getValidTransitions(from: T): T[];
}

export function createStateMachine<T extends string>(
  transitions: Record<T, T[]>,
): StateMachine<T> {
  const machine: StateMachine<T> = {
    transitions,

    canTransition(from: T, to: T): boolean {
      return transitions[from]?.includes(to) ?? false;
    },

    assertValidTransition(from: T, to: T): void {
      if (!this.canTransition(from, to)) {
        const allowed = transitions[from]?.join(', ') ?? 'none';
        throw new Error(
          `Cannot transition from '${from}' to '${to}'. Valid targets: ${allowed}`,
        );
      }
    },

    getValidTransitions(from: T): T[] {
      return [...(transitions[from] ?? [])];
    },
  };

  return machine;
}
