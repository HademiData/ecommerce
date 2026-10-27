import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ConflictException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { OtpService } from '../src/auth/otp.service.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let authService: {
    register: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      register: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: OtpService,
          useValue: {
            verifyEmailOtp: vi.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/register returns the created user', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'StrongPass!123',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201)
      .expect({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(authService.register).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }),
    );
  });

  it('POST /auth/register returns 409 for an existing email', async () => {
    authService.register.mockRejectedValue(
      new ConflictException('Email already exists'),
    );

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'StrongPass!123',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(409);
  });
});
