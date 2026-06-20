import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtBlacklistService } from '@/infrastructure/redis/jwt-blacklist.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, JwtBlacklistService],
  exports: [JwtModule, PassportModule, JwtAuthGuard, JwtBlacklistService],
})
export class AuthFoundationModule {}
