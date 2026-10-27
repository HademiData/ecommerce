import { ConflictException, Injectable, UnauthorizedException, } from '@nestjs/common';
import argon2 from 'argon2';

import { UsersService } from '../users/users.service.js';
import { RegisterDto, LoginDto } from './auth.dto.js';
import { JwtService } from '@nestjs/jwt';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity.js';


import { randomBytes } from 'node:crypto';
import { OtpService } from './otp.service.js';

import { OAuthAccount } from './oauth-account.entity.js';


@Injectable()
export class AuthService {
  constructor(  
            private readonly usersService: UsersService, 
            private readonly jwtService: JwtService,
            
            @InjectRepository(Session)
            private readonly sessionRepository: Repository<Session>,

            private readonly otpService: OtpService,

            @InjectRepository(OAuthAccount)
            private readonly oauthRepository: Repository<OAuthAccount>,
    ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.otpService.createEmailVerificationOtp(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }


async login(dto: LoginDto) {
  const user = await this.usersService.findByEmail(dto.email)

  if (!user || !user.passwordHash) {
    throw new UnauthorizedException('Invalid email or password')
  }

  const passwordValid = await argon2.verify(
    user.passwordHash,
    dto.password,
  )

  if (!passwordValid) {
    throw new UnauthorizedException('Invalid email or password')
  }

  const tokenId = randomBytes(16).toString('hex')
  const refreshToken = randomBytes(64).toString('hex')
  const refreshTokenHash = await argon2.hash(refreshToken)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await this.sessionRepository.save({
    user,
    tokenId,
    refreshTokenHash,
    expiresAt,
  })

  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
    role: user.role,
    jti: tokenId,
  })

  return {
    accessToken,
    refreshToken,
    tokenId,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  }
}

async refresh(tokenId: string, refreshToken: string) {
  const session = await this.sessionRepository.findOne({
    where: { tokenId },
    relations: { user: true },
  })

  if (!session || session.expiresAt <= new Date()) {
    throw new UnauthorizedException('Invalid refresh token')
  }

  const valid = await argon2.verify(
    session.refreshTokenHash,
    refreshToken,
  )

  if (!valid) {
    throw new UnauthorizedException('Invalid refresh token')
  }

  const newRefreshToken = randomBytes(64).toString('hex')
  const newRefreshTokenHash = await argon2.hash(newRefreshToken)

  session.refreshTokenHash = newRefreshTokenHash
  await this.sessionRepository.save(session)

  const accessToken = await this.jwtService.signAsync({
    sub: session.user.id,
    role: session.user.role,
    jti: session.tokenId,
  })

  return {
    accessToken,
    refreshToken: newRefreshToken,
    tokenId: session.tokenId,
    user: {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
    },
  }
}


    async logout(tokenId: string) {
        const session = await this.sessionRepository.findOne({
            where: { tokenId },
        
        });

        if (!session) {
            throw new UnauthorizedException('Invalid session');
        }

        await this.sessionRepository.remove(session);

        return {
            message: 'Logged out successfully',
        };
    }



    async resendVerificationOtp(email: string) {
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid request');
        }

        if (user.emailVerified) {
            throw new ConflictException('Email already verified');
        }

        await this.otpService.createEmailVerificationOtp(user);

        return {
            message: 'Verification OTP sent',
        };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            return {
            message: 'If the email exists, a reset code has been sent',
            };
        }

        await this.otpService.createPasswordResetOtp(user);

        return {
            message: 'If the email exists, a reset code has been sent',
        };
    }


    async resetPassword(
        userId: string,
        otp: string,
        newPassword: string,
        ) {
        const valid = await this.otpService.verifyPasswordResetOtp(
            userId,
            otp,
        );

        if (!valid) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        const passwordHash = await argon2.hash(newPassword);

        await this.usersService.updatePassword(
            userId,
            passwordHash,
        );

        await this.sessionRepository.delete({
            user: { id: userId },
        });

        return {
            message: 'Password reset successfully',
        };
    }

   
async loginWithGoogle(data: {
  providerId: string
  email: string
  firstName: string
  lastName: string
}) {
  let oauthAccount = await this.oauthRepository.findOne({
    where: {
      provider: 'google',
      providerId: data.providerId,
    },
    relations: {
      user: true,
    },
  })

  let user = await this.usersService.findByEmail(data.email)

  if (oauthAccount) {
    user = oauthAccount.user
  } else {
    if (!user) {
      user = await this.usersService.createUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash: null,
        emailVerified: true,
      })
    }

    await this.oauthRepository.save({
      provider: 'google',
      providerId: data.providerId,
      user,
    })
  }

  const tokenId = randomBytes(16).toString('hex')
  const refreshToken = randomBytes(64).toString('hex')
  const refreshTokenHash = await argon2.hash(refreshToken)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await this.sessionRepository.save({
    user,
    tokenId,
    refreshTokenHash,
    expiresAt,
  })

  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
    role: user.role,
    jti: tokenId,
  })

  return {
    accessToken,
    refreshToken,
    tokenId,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  }
}

}