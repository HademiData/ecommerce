import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

describe('OrdersController', () => {
  const ordersService = {
    create: vi.fn(),
    findMyOrders: vi.fn(),
    findOne: vi.fn(),
  };

  let controller: OrdersController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new OrdersController(ordersService as unknown as OrdersService);
  });

  it('creates an order using the authenticated user ID', async () => {
    const dto = { items: [{ productId: 'product-1', quantity: 1 }] };
    ordersService.create.mockResolvedValue({ id: 'order-1' });

    await expect(
      controller.create({ user: { sub: 'user-1' } }, dto),
    ).resolves.toEqual({ id: 'order-1' });

    expect(ordersService.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('supports user IDs provided as id', async () => {
    ordersService.findMyOrders.mockResolvedValue([]);

    await controller.findMyOrders({ user: { id: 'user-2' } });

    expect(ordersService.findMyOrders).toHaveBeenCalledWith('user-2');
  });

  it('rejects order creation when the user ID is missing', () => {
    expect(() =>
      controller.create({ user: {} }, { items: [] }),
    ).toThrow(UnauthorizedException);

    expect(ordersService.create).not.toHaveBeenCalled();
  });

  it('rejects order listing when the user ID is missing', () => {
    expect(() => controller.findMyOrders({ user: {} })).toThrow(
      UnauthorizedException,
    );

    expect(ordersService.findMyOrders).not.toHaveBeenCalled();
  });

  it('rejects fetching an order when the user ID is missing', () => {
    expect(() => controller.findOne({ user: {} }, 'order-1')).toThrow(
      UnauthorizedException,
    );

    expect(ordersService.findOne).not.toHaveBeenCalled();
  });
});
