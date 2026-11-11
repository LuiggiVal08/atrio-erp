import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtBlacklistService } from '@/infrastructure/redis/jwt-blacklist.service';
import { AuthSessionService } from './auth-session.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRATION || '15m') as JwtSignOptions['expiresIn'],
      },
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, JwtBlacklistService, AuthSessionService],
  exports: [JwtModule, PassportModule, JwtAuthGuard, JwtBlacklistService, AuthSessionService],
})
export class AuthFoundationModule {}
