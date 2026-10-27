import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadGatewayException,
  BadRequestException,
} from '@nestjs/common';
import { of } from 'rxjs';
import { OrdersService } from './orders.service.js';

describe('OrdersService', () => {
  const db = {
    $transaction: vi.fn(),
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    outboxEvent: { create: vi.fn() },
  };

  const http = {
    get: vi.fn(),
  };

  const config = {
    get: vi.fn(),
  };

  const transaction = {
    order: db.order,
    outboxEvent: db.outboxEvent,
  };

  let service: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation((callback) => callback(transaction));
    db.outboxEvent.create.mockResolvedValue({});

    config.get.mockReturnValue('http://localhost:3001');

    http.get.mockReturnValue(
      of({
        data: {
          _id: 'product-1',
          name: 'Wireless Keyboard',
          price: 25000,
          isActive: true,
        },
      }),
    );

    db.order.create.mockResolvedValue({
      id: 'order-1',
      status: 'PENDING',
      totalAmount: '25000.00',
      items: [],
    });

    service = new OrdersService(
      db as never,
      http as never,
      config as never,
    );
  });

  it('creates a pending order and records a stock reservation event', async () => {
    const result = await service.create('user-1', {
      items: [{ productId: 'product-1', quantity: 1 }],
    });

    expect(result.status).toBe('PENDING');
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

    expect(db.outboxEvent.create).toHaveBeenCalledWith({
      data: {
        topic: 'stock.reserve',
        payload: {
          orderId: 'order-1',
          items: [{ productId: 'product-1', quantity: 1 }],
        },
      },
    });
  });

  it('combines repeated product IDs before calculating the total', async () => {
    await service.create('user-1', {
      items: [
        { productId: 'product-1', quantity: 1 },
        { productId: 'product-1', quantity: 2 },
      ],
    });

    expect(http.get).toHaveBeenCalledTimes(1);

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
  });

  it('rejects an inactive product', async () => {
    http.get.mockReturnValue(
      of({
        data: {
          _id: 'product-1',
          name: 'Wireless Keyboard',
          price: 25000,
          isActive: false,
        },
      }),
    );

    await expect(
      service.create('user-1', {
        items: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(db.order.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid product price', async () => {
    http.get.mockReturnValue(
      of({
        data: {
          _id: 'product-1',
          name: 'Wireless Keyboard',
          price: 'invalid',
          isActive: true,
        },
      }),
    );

    await expect(
      service.create('user-1', {
        items: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(db.order.create).not.toHaveBeenCalled();
  });

  it('returns a gateway error when the Product Service is unavailable', async () => {
    http.get.mockImplementation(() => {
      throw new Error('Connection refused');
    });

    await expect(
      service.create('user-1', {
        items: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);

    expect(db.order.create).not.toHaveBeenCalled();
  });

  it('returns a gateway error when the Product Service URL is missing', async () => {
    config.get.mockReturnValue(undefined);

    await expect(
      service.create('user-1', {
        items: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);

    expect(http.get).not.toHaveBeenCalled();
    expect(db.order.create).not.toHaveBeenCalled();
  });

  it('does not save an order if its stock event cannot be recorded', async () => {
    db.outboxEvent.create.mockRejectedValue(new Error('Database unavailable'));

    await expect(
      service.create('user-1', {
        items: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toThrow('Database unavailable');

    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  it('records cancellation and its stock event in one transaction', async () => {
    db.order.findFirst.mockResolvedValue({
      id: 'order-1',
      status: 'PENDING',
      items: [{ productId: 'product-1', quantity: 2 }],
    });
    db.order.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.cancelOrder('user-1', 'order-1')).resolves.toEqual({
      message: 'Order cancelled successfully',
      orderId: 'order-1',
      status: 'CANCELLED',
    });

    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', userId: 'user-1', status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    expect(db.outboxEvent.create).toHaveBeenCalledWith({
      data: {
        topic: 'stock.cancel',
        payload: {
          orderId: 'order-1',
          items: [{ productId: 'product-1', quantity: 2 }],
        },
      },
    });
  });
});

describe('OrdersService retrieval', () => {
  const db = {
    $transaction: vi.fn(),
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    outboxEvent: { create: vi.fn() },
  };

  const http = { get: vi.fn() };
  const config = { get: vi.fn() };

  let service: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new OrdersService(
      db as never,
      http as never,
      config as never,
    );
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
