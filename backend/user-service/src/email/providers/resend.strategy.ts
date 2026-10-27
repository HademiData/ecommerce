
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import type { EmailMessage, EmailStrategy } from '../email.strategy.js'

@Injectable()
export class ResendStrategy implements EmailStrategy {
  private readonly client: Resend

  constructor(private readonly config: ConfigService) {
    this.client = new Resend(
      this.config.getOrThrow<string>('RESEND_API_KEY'),
    )
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.config.getOrThrow<string>('RESEND_FROM_EMAIL'),
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    })

    if (error) {
      throw new Error(`Resend email failed: ${error.message}`)
    }
  }
}
