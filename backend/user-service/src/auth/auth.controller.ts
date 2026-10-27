
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service.js';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.dto.js';
import { OtpService } from './otp.service.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import type { GoogleUser } from './types/google-user.js';

import { GoogleAdminAuthGuard } from './guards/google-admin-auth.guard.js'

const REFRESH_COOKIE = 'refresh_session';
const COOKIE_PATH = '/api/auth';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: COOKIE_PATH,
    maxAge: SESSION_MAX_AGE,
  };
}

function setRefreshCookie(
  response: Response,
  tokenId: string,
  refreshToken: string,
) {
  response.cookie(
    REFRESH_COOKIE,
    `${tokenId}.${refreshToken}`,
    cookieOptions(),
  );
}

function readRefreshCookie(request: Request) {
  const prefix = `${REFRESH_COOKIE}=`;
  const entry = request.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!entry) {
    return null;
  }

  const value = decodeURIComponent(entry.slice(prefix.length));
  const separator = value.indexOf('.');

  if (separator < 1) {
    return null;
  }

  return {
    tokenId: value.slice(0, separator),
    refreshToken: value.slice(separator + 1),
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);

    setRefreshCookie(response, session.tokenId, session.refreshToken);

    return {
      accessToken: session.accessToken,
      tokenId: session.tokenId,
      user: session.user,
    };
  }

  @Get('session')
  session(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.refreshFromCookie(request, response);
  }

  @Post('refresh')
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.refreshFromCookie(request, response);
  }

  private async refreshFromCookie(
    request: Request,
    response: Response,
  ) {
    const credentials = readRefreshCookie(request);

    if (!credentials) {
      throw new UnauthorizedException('No active session');
    }

    const session = await this.authService.refresh(
      credentials.tokenId,
      credentials.refreshToken,
    );

    setRefreshCookie(response, session.tokenId, session.refreshToken);

    return {
      accessToken: session.accessToken,
      tokenId: session.tokenId,
      user: session.user,
    };
  }

  @Post('logout')
  async logout(
    @Body() dto: LogoutDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie(REFRESH_COOKIE, {
      ...cookieOptions(),
      maxAge: undefined,
    });

    return this.authService.logout(dto.tokenId);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const verified = await this.otpService.verifyEmailOtp(
      dto.userId,
      dto.otp,
    );

    return { verified };
  }

  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationOtp(dto.email);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.userId,
      dto.otp,
      dto.newPassword,
    );
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @Get('google/admin')
  @UseGuards(GoogleAdminAuthGuard)
  googleAdminLogin() {}

  @Get('google/callback')
@UseGuards(GoogleAuthGuard)
async googleCallback(
  @Req() request: Request,
  @Res() response: Response,
) {
  const googleUser = request.user as GoogleUser
  const session = await this.authService.loginWithGoogle(googleUser)

  setRefreshCookie(response, session.tokenId, session.refreshToken)

  const cookies = request.headers.cookie ?? ''
  const isAdminLogin = cookies
    .split(';')
    .some((cookie) => cookie.trim() === 'oauth_client=admin')

  response.clearCookie('oauth_client', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/google/callback',
  })

  if (isAdminLogin) {
    response.redirect('http://localhost:5174/?google=admin')
    return
  }

  const frontendUrl =
    process.env.FRONTEND_URL ?? 'http://localhost:5173'

  response.redirect(`${frontendUrl}/auth/callback`)
}
}
