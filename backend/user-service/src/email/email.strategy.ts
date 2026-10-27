
export const EMAIL_STRATEGY = Symbol('EMAIL_STRATEGY')

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html?: string
}

export interface EmailStrategy {
  send(message: EmailMessage): Promise<void>
}
