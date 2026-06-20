import * as bcrypt from 'bcrypt';
import { AuthRepository, LoginData } from '../domain/auth.repository.interface';

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
  };
  jti: string;
}

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(dto: LoginData): Promise<LoginResult> {
    const user = await this.authRepository.findUserByEmail(dto.email, dto.tenantId);

    if (!user || user.deletedAt) {
      throw new Error('Invalid credentials');
    }

    if (user.status === 'blocked' && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account temporarily locked');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };

      if (attempts >= LOCK_THRESHOLD) {
        updateData.status = 'blocked';
        updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }

      await this.authRepository.updateLoginAttempts(user.id, updateData);
      throw new Error('Invalid credentials');
    }

    await this.authRepository.updateLoginAttempts(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId },
      jti: crypto.randomUUID(),
    };
  }
}
