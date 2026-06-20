export interface TokenBlacklist {
  blacklist(jti: string, expiresIn: number): Promise<void>;
}

export class LogoutUseCase {
  constructor(private readonly tokenBlacklist: TokenBlacklist) {}

  async execute(payload: { sub: string; jti: string }, expiresIn: number) {
    await this.tokenBlacklist.blacklist(payload.jti, expiresIn);
  }
}
