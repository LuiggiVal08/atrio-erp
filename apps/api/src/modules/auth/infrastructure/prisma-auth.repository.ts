import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AuthRepository, UserCredentials } from '../domain/auth.repository.interface';

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string, tenantId: string): Promise<UserCredentials | null> {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    return user as any;
  }

  async updateLoginAttempts(
    userId: string,
    data: {
      failedLoginAttempts: number;
      status?: string;
      lockedUntil?: Date | null;
      lastLoginAt?: Date;
    },
  ): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: data as any });
  }
}
