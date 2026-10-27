
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BrevoClient } from '@getbrevo/brevo'
import type { EmailMessage, EmailStrategy } from '../email.strategy.js'

@Injectable()
export class BrevoStrategy implements EmailStrategy {
  private readonly client: BrevoClient

  constructor(private readonly config: ConfigService) {
    this.client = new BrevoClient({
      apiKey: this.config.getOrThrow<string>('BREVO_API_KEY'),
    })
  }

  async send(message: EmailMessage): Promise<void> {
    await this.client.transactionalEmails.sendTransacEmail({
      sender: {
        name: this.config.get<string>('BREVO_FROM_NAME') ?? 'Ràtech',
        email: this.config.getOrThrow<string>('BREVO_FROM_EMAIL'),
      },
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
      ...(message.html ? { htmlContent: message.html } : {}),
    })
  }
}
