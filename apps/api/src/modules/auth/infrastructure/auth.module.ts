import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../application/login.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { JwtAuthAdapter } from './jwt-auth.adapter';
import { PrismaAuthRepository } from './prisma-auth.repository';
import { AuthFoundationModule } from '@/common/auth/auth.module';
import { JwtBlacklistService } from '@/infrastructure/redis/jwt-blacklist.service';

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
      useFactory: (repo: any) => new LoginUseCase(repo),
      inject: [AUTH_REPOSITORY],
    },
    {
      provide: LogoutUseCase,
      useFactory: (blacklist: any) => new LogoutUseCase(blacklist),
      inject: [JwtBlacklistService],
    },
  ],
  exports: [],
})
export class AuthModule {}
