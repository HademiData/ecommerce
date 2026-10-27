import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { Product } from './schemas/product.schema.js';

describe('ProductsService', () => {
  let service: ProductsService;
  let model: Record<string, any>;

  const productId = '507f1f77bcf86cd799439011';
  const reservationId = 'order-test:product-test';

  beforeEach(async () => {
    model = {
      exists: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      findOneAndUpdate: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: model },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects a duplicate SKU', async () => {
    model.exists.mockResolvedValue({ _id: productId });

    await expect(
      service.create({ sku: 'KEY-001' } as any),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(model.create).not.toHaveBeenCalled();
  });

  it('returns a paginated product list', async () => {
    const products = [{ name: 'Test keyboard' }];
    const query = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'desc',
    };

    model.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(products),
          }),
        }),
      }),
    });
    model.countDocuments.mockReturnValue({
      exec: vi.fn().mockResolvedValue(1),
    });

    await expect(service.findAll(query as any)).resolves.toEqual({
      data: products,
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('rejects an invalid product ID', async () => {
    await expect(service.findOne('invalid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when a product does not exist', async () => {
    model.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.findOne(productId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects invalid reservation quantities', async () => {
    await expect(
      service.reserveStockForOrder(productId, 0, reservationId),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('reserves stock atomically for an order', async () => {
    const updatedProduct = { _id: productId, stock: 7 };

    model.findOneAndUpdate.mockResolvedValue(updatedProduct);

    await expect(
      service.reserveStockForOrder(productId, 3, reservationId),
    ).resolves.toBe(updatedProduct);

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: productId,
        isActive: true,
        stock: { $gte: 3 },
        appliedReservationIds: { $ne: reservationId },
        releasedReservationIds: { $ne: reservationId },
      },
      {
        $inc: { stock: -3 },
        $addToSet: { appliedReservationIds: reservationId },
      },
      { new: true, runValidators: true },
    );
  });

  it('rejects a reservation when stock is insufficient', async () => {
    model.findOneAndUpdate.mockResolvedValue(null);
    model.findById.mockResolvedValue({
      _id: productId,
      stock: 1,
      appliedReservationIds: [],
    });

    await expect(
      service.reserveStockForOrder(productId, 3, reservationId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not reserve the same order twice', async () => {
    const existingProduct = {
      _id: productId,
      stock: 7,
      appliedReservationIds: [reservationId],
    };

    model.findOneAndUpdate.mockResolvedValue(null);
    model.findById.mockResolvedValue(existingProduct);

    await expect(
      service.reserveStockForOrder(productId, 3, reservationId),
    ).resolves.toBe(existingProduct);
  });

  it('releases a reservation only once', async () => {
    const existingProduct = {
      _id: productId,
      stock: 10,
      appliedReservationIds: [reservationId],
      releasedReservationIds: [reservationId],
    };

    model.findOneAndUpdate.mockResolvedValue(null);
    model.findById.mockResolvedValue(existingProduct);

    await expect(
      service.releaseStockForOrder(productId, 3, reservationId),
    ).resolves.toBe(existingProduct);
  });
});
