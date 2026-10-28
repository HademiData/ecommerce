import 'pg';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity.js';
import { OAuthAccount } from '../auth/oauth-account.entity.js';
import { Session } from '../auth/session.entity.js';
import { OtpCode } from '../auth/otp-code.entity.js';
import { PasswordReset } from '../auth/password-reset.entity.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT') ?? 5432),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        ssl: { rejectUnauthorized: false },
        entities: [
          User,
          OAuthAccount,
          Session,
          OtpCode,
          PasswordReset,
        ],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}