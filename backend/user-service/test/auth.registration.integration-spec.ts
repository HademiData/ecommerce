import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/user.entity.js';
import { UsersService } from '../src/users/users.service.js';
import { OtpCode } from '../src/auth/otp-code.entity.js';
import { OtpService } from '../src/auth/otp.service.js';
import { Session } from '../src/auth/session.entity.js';
import { OAuthAccount } from '../src/auth/oauth-account.entity.js';
import { PasswordReset } from '../src/auth/password-reset.entity.js';
import { AuthService } from '../src/auth/auth.service.js';
import { AuthController } from '../src/auth/auth.controller.js';
import argon2 from 'argon2';
import request from 'supertest';

if (process.env.DB_NAME !== 'ecommerce_users_test') {
  throw new Error(
    'Safety check failed: integration tests may only use ecommerce_users_test.',
  );
}

describe('User registration PostgreSQL integration', () => {
  let app: INestApplication;
  let users: Repository<User>;
  let otpCodes: Repository<OtpCode>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [User, OtpCode, Session, OAuthAccount, PasswordReset],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          User,
          OtpCode,
          Session,
          OAuthAccount,
          PasswordReset,
        ]),
        JwtModule.register({
          secret: 'integration-test-only-secret',
        }),
      ],
      controllers: [AuthController],
      providers: [AuthService, UsersService, OtpService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    users = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    otpCodes = moduleRef.get<Repository<OtpCode>>(getRepositoryToken(OtpCode));
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers a user and persists password and OTP hashes', async () => {
    const email = `register-${randomUUID()}@example.com`;
    const password = 'Integration-test-password-42';

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        firstName: 'Integration',
        lastName: 'Tester',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      email,
      firstName: 'Integration',
      lastName: 'Tester',
    });
    expect(response.body).not.toHaveProperty('passwordHash');

    const savedUser = await users.findOneByOrFail({ email });

    expect(savedUser.passwordHash).not.toBe(password);
    expect(await argon2.verify(savedUser.passwordHash!, password)).toBe(true);
    expect(savedUser.emailVerified).toBe(false);

    const savedOtp = await otpCodes.findOne({
      where: {
        user: { id: savedUser.id },
        purpose: 'EMAIL_VERIFICATION',
      },
      relations: { user: true },
    });

    expect(savedOtp).not.toBeNull();
    expect(savedOtp!.codeHash).toMatch(/^\$argon2/);
    expect(savedOtp!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(savedOtp!.used).toBe(false);
  });

  it('rejects duplicate email registration without creating another user', async () => {
    const email = `duplicate-${randomUUID()}@example.com`;
    const payload = {
      email,
      password: 'Integration-test-password-42',
      firstName: 'Duplicate',
      lastName: 'Tester',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(409);

    expect(await users.countBy({ email })).toBe(1);
    expect(
      await otpCodes.count({
        where: {
          user: { email },
          purpose: 'EMAIL_VERIFICATION',
        },
      }),
    ).toBe(1);
  });
});
