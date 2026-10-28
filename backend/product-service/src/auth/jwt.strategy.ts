import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface AuthenticatedUser {
  userId: string;
  role: 'customer' | 'admin';
}


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'product-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: { sub: string; role: string }): AuthenticatedUser {
    if (
      typeof payload.sub !== 'string' ||
      !['customer', 'admin'].includes(payload.role)
    ) {
      throw new UnauthorizedException('Invalid access token');
    }

    return {
      userId: payload.sub,
      role: payload.role as AuthenticatedUser['role'],
    };
  }
}