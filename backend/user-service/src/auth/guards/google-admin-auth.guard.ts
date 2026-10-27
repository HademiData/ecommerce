import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request, Response } from 'express'

@Injectable()
export class GoogleAdminAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    const response = context.switchToHttp().getResponse<Response>()

    response.cookie('oauth_client', 'admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/google/callback',
      maxAge: 10 * 60 * 1000,
    })

    return super.canActivate(context)
  }
}