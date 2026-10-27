import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { afterEach, beforeEach, vi } from 'vitest';

describe('API Gateway (e2e)', () => {
  let app: INestApplication<App>;
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    process.env.ORDER_SERVICE_URL = 'http://order-service.test';
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.ORDER_SERVICE_URL;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns a healthy status', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });

  it('forwards an authenticated order request', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify([{ id: 'test-order' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(response.body).toEqual([{ id: 'test-order' }]);
    const [url, options] = vi.mocked(globalThis.fetch).mock.calls[0]!;
    expect(url).toBe('http://order-service.test/orders');
    expect(options?.method).toBe('GET');
    expect(new Headers(options?.headers).get('authorization')).toBe(
      'Bearer test-token',
    );
  });

  it('returns 502 when the backend is unavailable', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Unavailable'));

    const response = await request(app.getHttpServer())
      .get('/orders')
      .expect(502);

    expect(response.body).toEqual({
      message: 'Backend service unavailable',
    });
  });
});
