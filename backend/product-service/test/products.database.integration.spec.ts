import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ProductsService } from '../src/products/products.service.js';
import {
  Product,
  ProductSchema,
} from '../src/products/schemas/product.schema.js';

describe('ProductsService MongoDB integration', () => {
  let moduleRef: TestingModule;
  let products: Model<Product>;
  let service: ProductsService;

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI must target ecommerce_products_test');
    }

    const databaseName = new URL(uri).pathname.replace('/', '');

    if (databaseName !== 'ecommerce_products_test') {
      throw new Error(
        `Refusing to run integration tests against database: ${databaseName}`,
      );
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Product.name, schema: ProductSchema },
        ]),
      ],
      providers: [ProductsService],
    }).compile();

    await moduleRef.init();

    service = moduleRef.get<ProductsService>(ProductsService);
    products = moduleRef.get<Model<Product>>(getModelToken(Product.name));
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  async function createProduct(stock = 5) {
    return products.create({
      name: 'Integration Test Product',
      description: 'Temporary product for automated tests',
      price: 100,
      category: 'Test',
      sku: `TEST-${new Types.ObjectId().toString()}`,
      stock,
    });
  }

  it('reserves stock and prevents duplicate reservations', async () => {
    const product = await createProduct(5);
    const reservationId = `order-${new Types.ObjectId().toString()}`;

    try {
      const first = await service.reserveStockForOrder(
        product.id,
        2,
        reservationId,
      );

      expect(first.stock).toBe(3);

      const duplicate = await service.reserveStockForOrder(
        product.id,
        2,
        reservationId,
      );

      expect(duplicate.stock).toBe(3);
      expect(duplicate.appliedReservationIds).toContain(reservationId);

      const saved = await products.findById(product.id).orFail();
      expect(saved.stock).toBe(3);
    } finally {
      await products.deleteOne({ _id: product._id });
    }
  });

  it('rejects reservations when stock is insufficient', async () => {
    const product = await createProduct(1);

    try {
      await expect(
        service.reserveStockForOrder(
          product.id,
          2,
          `order-${new Types.ObjectId().toString()}`,
        ),
      ).rejects.toThrow(ConflictException);

      const saved = await products.findById(product.id).orFail();
      expect(saved.stock).toBe(1);
    } finally {
      await products.deleteOne({ _id: product._id });
    }
  });

  it('throws NotFoundException for a missing product', async () => {
    await expect(
      service.reserveStockForOrder(
        new Types.ObjectId().toString(),
        1,
        `order-${new Types.ObjectId().toString()}`,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects invalid quantities without changing stock', async () => {
    const product = await createProduct(5);

    try {
      await expect(
        service.reserveStockForOrder(product.id, 0, 'invalid-quantity-test'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.reserveStockForOrder(product.id, 1.5, 'fraction-test'),
      ).rejects.toThrow(BadRequestException);

      const saved = await products.findById(product.id).orFail();
      expect(saved.stock).toBe(5);
    } finally {
      await products.deleteOne({ _id: product._id });
    }
  });

  it('releases a reservation only once', async () => {
    const product = await createProduct(5);
    const reservationId = `order-${new Types.ObjectId().toString()}`;

    try {
      await service.reserveStockForOrder(product.id, 2, reservationId);

      const released = await service.releaseStockForOrder(
        product.id,
        2,
        reservationId,
      );

      expect(released.stock).toBe(5);
      expect(released.releasedReservationIds).toContain(reservationId);

      const duplicateRelease = await service.releaseStockForOrder(
        product.id,
        2,
        reservationId,
      );

      expect(duplicateRelease.stock).toBe(5);

      const saved = await products.findById(product.id).orFail();
      expect(saved.stock).toBe(5);
    } finally {
      await products.deleteOne({ _id: product._id });
    }
  });

  it('throws NotFoundException when releasing stock for a missing product', async () => {
    await expect(
      service.releaseStockForOrder(
        new Types.ObjectId().toString(),
        1,
        'missing-product-reservation',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
