
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module.js';
import { EmailModule } from '../email/email.module.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';
import { Session } from './session.entity.js';
import { OtpCode } from './otp-code.entity.js';
import { OAuthAccount } from './oauth-account.entity.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    EmailModule,
    TypeOrmModule.forFeature([Session, OtpCode, OAuthAccount]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    JwtStrategy,
    RolesGuard,
    GoogleStrategy,
  ],
})
export class AuthModule {}