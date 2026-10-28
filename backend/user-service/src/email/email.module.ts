import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { EMAIL_STRATEGY } from './email.strategy.js'
import { BrevoStrategy } from './providers/brevo.strategy.js'
import { ResendStrategy } from './providers/resend.strategy.js'

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_STRATEGY,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = (
          config.get<string>('EMAIL_PROVIDER') ?? 'brevo'
        ).toLowerCase()

        switch (provider) {
          case 'brevo':
            return new BrevoStrategy(config)
          case 'resend':
            return new ResendStrategy(config)
          default:
            throw new Error(`Unsupported email provider: ${provider}`)
        }
      },
    },
  ],
  exports: [EMAIL_STRATEGY],
})
export class EmailModule {}