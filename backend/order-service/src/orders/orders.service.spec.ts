import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';

describe('OrdersService', () => {
  const db = {
    $transaction: vi.fn(),
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const products = {
    findOne: vi.fn(),
    reserveStockForOrder: vi.fn(),
    releaseStockForOrder: vi.fn(),
  };

  const transaction = { order: db.order };
  let service: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation((callback) => callback(transaction));
    products.findOne.mockResolvedValue({
      _id: 'product-1',
      name: 'Wireless Keyboard',
      price: 25000,
      isActive: true,
    });
    products.reserveStockForOrder.mockResolvedValue({});
    products.releaseStockForOrder.mockResolvedValue({});
    db.order.create.mockResolvedValue({
      id: 'order-1',
      status: 'PENDING',
      totalAmount: '25000.00',
      items: [],
    });
    db.order.update.mockResolvedValue({
      id: 'order-1',
      status: 'CONFIRMED',
      totalAmount: '25000.00',
      items: [],
    });

    service = new OrdersService(db as never, products as never);
  });

  it('creates a confirmed order and reserves stock in-process', async () => {
    const result = await service.create('user-1', {
      items: [{ productId: 'product-1', quantity: 1 }],
    });

    expect(result.status).toBe('CONFIRMED');
    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(db.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          totalAmount: '25000.00',
          status: 'PENDING',
        }),
      }),
    );
    expect(products.reserveStockForOrder).toHaveBeenCalledWith(
      'product-1',
      1,
      'order-1',
    );
  });

  it('combines repeated product IDs before calculating and reserving', async () => {
    await service.create('user-1', {
      items: [
        { productId: 'product-1', quantity: 1 },
        { productId: 'product-1', quantity: 2 },
      ],
    });

    expect(products.findOne).toHaveBeenCalledTimes(1);
    expect(db.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: '75000.00',
          items: {
            create: [
              expect.objectContaining({
                productId: 'product-1',
                quantity: 3,
                unitPrice: '25000.00',
              }),
            ],
          },
        }),
      }),
    );
    expect(products.reserveStockForOrder).toHaveBeenCalledWith(
      'product-1',
      3,
      'order-1',
    );
  });

  it('rejects an inactive product', async () => {
    products.findOne.mockResolvedValue({
      _id: 'product-1',
      name: 'Wireless Keyboard',
      price: 25000,
      isActive: false,
    });

    await expect(
      service.create('user-1', {
        items: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(db.order.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid product price', async () => {
    products.findOne.mockResolvedValue({
      _id: 'product-1',
      name: 'Wireless Keyboard',
      price: 'invalid',
      isActive: true,
    });

    await expect(
      service.create('user-1', {
        items: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(db.order.create).not.toHaveBeenCalled();
  });

  it('restores already reserved stock and cancels the order on failure', async () => {
    products.findOne
      .mockResolvedValueOnce({
        _id: 'product-1',
        name: 'Keyboard',
        price: 25000,
        isActive: true,
      })
      .mockResolvedValueOnce({
        _id: 'product-2',
        name: 'Mouse',
        price: 10000,
        isActive: true,
      });
    products.reserveStockForOrder
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new BadRequestException('Out of stock'));

    await expect(
      service.create('user-1', {
        items: [
          { productId: 'product-1', quantity: 1 },
          { productId: 'product-2', quantity: 1 },
        ],
      }),
    ).rejects.toThrow('Out of stock');

    expect(products.releaseStockForOrder).toHaveBeenCalledWith(
      'product-1',
      1,
      'order-1',
    );
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'CANCELLED' },
    });
  });

  it('cancels a confirmed order and releases reserved stock', async () => {
    db.order.findFirst.mockResolvedValue({
      id: 'order-1',
      status: 'CONFIRMED',
      items: [{ productId: 'product-1', quantity: 2 }],
    });
    db.order.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.cancelOrder('user-1', 'order-1')).resolves.toEqual({
      message: 'Order cancelled successfully',
      orderId: 'order-1',
      status: 'CANCELLED',
    });

    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', userId: 'user-1', status: 'CONFIRMED' },
      data: { status: 'CANCELLED' },
    });
    expect(products.releaseStockForOrder).toHaveBeenCalledWith(
      'product-1',
      2,
      'order-1',
    );
  });
});

describe('OrdersService retrieval', () => {
  const db = {
    $transaction: vi.fn(),
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const products = {
    findOne: vi.fn(),
    reserveStockForOrder: vi.fn(),
    releaseStockForOrder: vi.fn(),
  };

  let service: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrdersService(db as never, products as never);
  });

  it('returns only the authenticated user’s orders', async () => {
    db.order.findMany.mockResolvedValue([{ id: 'order-1' }]);

    const result = await service.findMyOrders('user-1');

    expect(result).toEqual([{ id: 'order-1' }]);
    expect(db.order.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('fetches a specific order belonging to the user', async () => {
    db.order.findFirst.mockResolvedValue({ id: 'order-1' });

    const result = await service.findOne('user-1', 'order-1');

    expect(result).toEqual({ id: 'order-1' });
    expect(db.order.findFirst).toHaveBeenCalledWith({
      where: { id: 'order-1', userId: 'user-1' },
      include: { items: true },
    });
  });

  it('does not return another user’s order', async () => {
    db.order.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('user-2', 'order-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(db.order.findFirst).toHaveBeenCalledWith({
      where: { id: 'order-1', userId: 'user-2' },
      include: { items: true },
    });
  });

  it('returns an empty list when the user has no orders', async () => {
    db.order.findMany.mockResolvedValue([]);

    await expect(service.findMyOrders('user-1')).resolves.toEqual([]);
  });
});
