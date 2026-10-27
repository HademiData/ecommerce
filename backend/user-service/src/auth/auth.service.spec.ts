import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn(),
    verify: vi.fn(),
  },
}));

import argon2 from 'argon2';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let sessionRepository: any;
  let otpService: any;
  let oauthRepository: any;

  const user = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'hashed-password',
    role: 'customer',
    emailVerified: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    usersService = {
      findByEmail: vi.fn(),
      createUser: vi.fn(),
      updatePassword: vi.fn(),
    };

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('access-token'),
    };

    sessionRepository = {
      save: vi.fn().mockImplementation(async (session) => session),
      findOne: vi.fn(),
      remove: vi.fn(),
      delete: vi.fn(),
    };

    otpService = {
      createEmailVerificationOtp: vi.fn(),
      createPasswordResetOtp: vi.fn(),
      verifyPasswordResetOtp: vi.fn(),
    };

    oauthRepository = {
      findOne: vi.fn(),
      save: vi.fn(),
    };

    service = new AuthService(
      usersService,
      jwtService,
      sessionRepository,
      otpService,
      oauthRepository,
    );
  });

  it('registers a new user with a hashed password and verification OTP', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    vi.mocked(argon2.hash).mockResolvedValue('new-password-hash' as never);
    usersService.createUser.mockResolvedValue(user);

    const result = await service.register({
      email: user.email,
      password: 'StrongPass!123',
      firstName: user.firstName,
      lastName: user.lastName,
    });

    expect(argon2.hash).toHaveBeenCalledWith('StrongPass!123');
    expect(usersService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'new-password-hash' }),
    );
    expect(otpService.createEmailVerificationOtp).toHaveBeenCalledWith(user);
    expect(result).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  });

  it('rejects registration when the email already exists', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      service.register({
        email: user.email,
        password: 'StrongPass!123',
        firstName: 'Test',
        lastName: 'User',
      }),
    ).rejects.toThrow(ConflictException);

    expect(usersService.createUser).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials and creates a session', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    vi.mocked(argon2.verify).mockResolvedValue(true as never);
    vi.mocked(argon2.hash).mockResolvedValue('refresh-hash' as never);

    const result = await service.login({
      email: user.email,
      password: 'StrongPass!123',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      role: user.role,
    });
    expect(sessionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        refreshTokenHash: 'refresh-hash',
        tokenId: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user.email).toBe(user.email);
  });

  it('rejects login for an unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: user.email, password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(sessionRepository.save).not.toHaveBeenCalled();
  });

  it('rejects login when the password is incorrect', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    vi.mocked(argon2.verify).mockResolvedValue(false as never);

    await expect(
      service.login({ email: user.email, password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('logs out and removes an existing session', async () => {
    const session = { tokenId: 'session-1' };
    sessionRepository.findOne.mockResolvedValue(session);

    await expect(service.logout('session-1')).resolves.toEqual({
      message: 'Logged out successfully',
    });

    expect(sessionRepository.remove).toHaveBeenCalledWith(session);
  });

  it('rejects logout when the session does not exist', async () => {
    sessionRepository.findOne.mockResolvedValue(null);

    await expect(service.logout('missing')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refreshes a valid session and rotates its refresh token', async () => {
    const session = {
      tokenId: 'session-1',
      user,
      refreshTokenHash: 'old-hash',
      expiresAt: new Date(Date.now() + 60_000),
    };

    sessionRepository.findOne.mockResolvedValue(session);
    vi.mocked(argon2.verify).mockResolvedValue(true as never);
    vi.mocked(argon2.hash).mockResolvedValue('new-hash' as never);

    const result = await service.refresh('session-1', 'old-refresh-token');

    expect(session.refreshTokenHash).toBe('new-hash');
    expect(sessionRepository.save).toHaveBeenCalledWith(session);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe('old-refresh-token');
  });

  it('rejects an expired refresh session', async () => {
    sessionRepository.findOne.mockResolvedValue({
      tokenId: 'session-1',
      user,
      refreshTokenHash: 'old-hash',
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      service.refresh('session-1', 'old-refresh-token'),
    ).rejects.toThrow(UnauthorizedException);

    expect(argon2.verify).not.toHaveBeenCalled();
  });

  it('returns the same safe response for unknown forgot-password emails', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.forgotPassword('unknown@example.com')).resolves.toEqual({
      message: 'If the email exists, a reset code has been sent',
    });

    expect(otpService.createPasswordResetOtp).not.toHaveBeenCalled();
  });

  it('resets the password and invalidates existing sessions after valid OTP', async () => {
    otpService.verifyPasswordResetOtp.mockResolvedValue(true);
    vi.mocked(argon2.hash).mockResolvedValue('reset-password-hash' as never);

    await expect(
      service.resetPassword('user-1', '123456', 'NewStrongPass!123'),
    ).resolves.toEqual({ message: 'Password reset successfully' });

    expect(usersService.updatePassword).toHaveBeenCalledWith(
      'user-1',
      'reset-password-hash',
    );
    expect(sessionRepository.delete).toHaveBeenCalledWith({
      user: { id: 'user-1' },
    });
  });

  it('rejects password reset when the OTP is invalid', async () => {
    otpService.verifyPasswordResetOtp.mockResolvedValue(false);

    await expect(
      service.resetPassword('user-1', '000000', 'NewStrongPass!123'),
    ).rejects.toThrow(UnauthorizedException);

    expect(usersService.updatePassword).not.toHaveBeenCalled();
  });

  it('logs in an existing Google account', async () => {
    oauthRepository.findOne.mockResolvedValue({
      provider: 'google',
      providerId: 'google-123',
      user,
    });
    usersService.findByEmail.mockResolvedValue(user);
    vi.mocked(argon2.hash).mockResolvedValue('refresh-hash' as never);

    const result = await service.loginWithGoogle({
      providerId: 'google-123',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      role: user.role,
    });
    expect(sessionRepository.save).toHaveBeenCalled();
    expect(result.user.id).toBe(user.id);
  });
});
