
import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { randomInt } from 'node:crypto'
import { Repository } from 'typeorm'
import argon2 from 'argon2'

import { OtpCode } from './otp-code.entity.js'
import { User } from '../users/user.entity.js'
import { UsersService } from '../users/users.service.js'
import {
  EMAIL_STRATEGY,
  type EmailStrategy,
} from '../email/email.strategy.js'

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepository: Repository<OtpCode>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @Inject(EMAIL_STRATEGY)
    private readonly email: EmailStrategy,
  ) {}

  async createEmailVerificationOtp(user: User) {
    await this.otpRepository.update(
      {
        user: { id: user.id },
        purpose: 'EMAIL_VERIFICATION',
        used: false,
      },
      { used: true },
    )

    const otp = randomInt(100000, 1000000).toString()
    const codeHash = await argon2.hash(otp)

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    await this.otpRepository.save({
      user,
      codeHash,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt,
      attempts: 0,
    })

    await this.email.send({
      to: user.email,
      subject: 'Verify your Ràtech account',
      text: `Your Ràtech verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
          <h2>Verify your Ràtech account</h2>
          <p>Enter this code to verify your email address:</p>
          <p style="font-size:30px;font-weight:bold;letter-spacing:6px">${otp}</p>
          <p>This code expires in 10 minutes. If you didn't create this account, ignore this email.</p>
        </div>
      `,
    })

    return otp
  }

  async verifyEmailOtp(userId: string, otp: string) {
    const otpCodes = await this.otpRepository.find({
      where: {
        user: { id: userId },
        purpose: 'EMAIL_VERIFICATION',
        used: false,
      },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    })

    const otpCode = otpCodes[0]

    if (!otpCode || otpCode.expiresAt < new Date()) {
      return false
    }

    if (otpCode.attempts >= 5) {
      return false
    }

    const valid = await argon2.verify(otpCode.codeHash, otp)

    if (!valid) {
      otpCode.attempts += 1
      await this.otpRepository.save(otpCode)
      return false
    }

    otpCode.used = true
    await this.otpRepository.save(otpCode)
    await this.usersService.verifyEmail(userId)

    return true
  }

  async createPasswordResetOtp(user: User) {
    await this.otpRepository.update(
      {
        user: { id: user.id },
        purpose: 'PASSWORD_RESET',
        used: false,
      },
      { used: true },
    )

    const otp = randomInt(100000, 1000000).toString()
    const codeHash = await argon2.hash(otp)

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    await this.otpRepository.save({
      user,
      codeHash,
      purpose: 'PASSWORD_RESET',
      expiresAt,
      attempts: 0,
    })

    await this.email.send({
      to: user.email,
      subject: 'Reset your Ràtech password',
      text: `Your Ràtech password reset code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
          <h2>Reset your Ràtech password</h2>
          <p>Use this code to reset your password:</p>
          <p style="font-size:30px;font-weight:bold;letter-spacing:6px">${otp}</p>
          <p>This code expires in 10 minutes. If you didn't request a reset, ignore this email.</p>
        </div>
      `,
    })
  }

  async verifyPasswordResetOtp(userId: string, otp: string) {
    const otpCodes = await this.otpRepository.find({
      where: {
        user: { id: userId },
        purpose: 'PASSWORD_RESET',
        used: false,
      },
      order: { createdAt: 'DESC' },
    })

    const otpCode = otpCodes[0]

    if (!otpCode || otpCode.expiresAt < new Date()) {
      return false
    }

    if (otpCode.attempts >= 5) {
      return false
    }

    const valid = await argon2.verify(otpCode.codeHash, otp)

    if (!valid) {
      otpCode.attempts += 1
      await this.otpRepository.save(otpCode)
      return false
    }

    otpCode.used = true
    await this.otpRepository.save(otpCode)

    return true
  }
}
