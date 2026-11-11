export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (amount < 0) throw new Error('Money amount cannot be negative');
    if (!currency || currency.trim().length === 0) throw new Error('Currency is required');
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error(`Currency mismatch: cannot add ${other.currency} to ${this.currency}`);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) throw new Error(`Currency mismatch: cannot subtract ${other.currency} from ${this.currency}`);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  withAmount(amount: number): Money {
    return new Money(amount, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }
}
