import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../application/login.use-case';
import { JwtAuthAdapter } from './jwt-auth.adapter';
import { PrismaAuthRepository } from './prisma-auth.repository';
import { AuthFoundationModule } from '@/common/auth/auth.module';
import { PrismaService } from '@/infrastructure/database/prisma.service';

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';

@Module({
  imports: [
    AuthFoundationModule,
  ],
  controllers: [AuthController],
  providers: [
    JwtAuthAdapter,
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
    {
      provide: LoginUseCase,
      useFactory: (repo: any, prisma: PrismaService) => new LoginUseCase(repo, prisma),
      inject: [AUTH_REPOSITORY, PrismaService],
    },
  ],
  exports: [],
})
export class AuthModule {}
