import { Test } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { InternalServiceGuard } from '../auth/internal-service.guard.js';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      reserveStock: vi.fn(),
      releaseStock: vi.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(InternalServiceGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ProductsController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates product listing to the service', async () => {
    const query = { page: 1, limit: 10 };
    const result = { data: [], pagination: { page: 1, limit: 10 } };
    service.findAll.mockResolvedValue(result);

    await expect(controller.findAll(query as any)).resolves.toBe(result);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates product lookup to the service', async () => {
    const product = { name: 'Keyboard' };
    service.findOne.mockResolvedValue(product);

    await expect(controller.findOne('product-id')).resolves.toBe(product);
    expect(service.findOne).toHaveBeenCalledWith('product-id');
  });

  it('delegates stock reservation to the service', async () => {
    const product = { stock: 7 };
    service.reserveStock.mockResolvedValue(product);

    await expect(
      controller.reserveStock('product-id', 2),
    ).resolves.toBe(product);

    expect(service.reserveStock).toHaveBeenCalledWith('product-id', 2);
  });

  it('delegates stock release to the service', async () => {
    const product = { stock: 9 };
    service.releaseStock.mockResolvedValue(product);

    await expect(
      controller.releaseStock('product-id', 2),
    ).resolves.toBe(product);

    expect(service.releaseStock).toHaveBeenCalledWith('product-id', 2);
  });
});
