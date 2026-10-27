import {
  IsEmail,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @Length(2, 50)
  lastName: string;

  @IsStrongPassword()
  password: string;
}


export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}


export class RefreshTokenDto {
  @IsString()
  tokenId: string;

  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  tokenId: string;
}

export class VerifyEmailDto {
  @IsString()
  userId: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  userId: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsStrongPassword()
  newPassword: string;
}