
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DatabaseService } from '../database/database.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get productUrl(): string {
    const url = this.config.get<string>('PRODUCT_SERVICE_URL');
    if (!url) {
      throw new BadGatewayException('Product Service is not configured');
    }
    return url;
  }

  async create(userId: string, dto: CreateOrderDto) {
    const quantities = new Map<string, number>();

    for (const item of dto.items) {
      const total =
        (quantities.get(item.productId) ?? 0) + item.quantity;

      if (!Number.isSafeInteger(total)) {
        throw new BadRequestException('Invalid product quantity');
      }

      quantities.set(item.productId, total);
    }

    const items = await Promise.all(
      [...quantities.entries()].map(async ([productId, quantity]) => {
        try {
          const response = await firstValueFrom(
            this.http.get(`${this.productUrl}/products/${productId}`),
          );

          const product = response.data;
          const price = Number(product?.price);

          if (
            !product ||
            product.isActive === false ||
            !Number.isFinite(price) ||
            price < 0 ||
            !product.name
          ) {
            throw new BadRequestException(
              `Product ${productId} is unavailable`,
            );
          }

          return {
            productId: String(product.id ?? product._id),
            name: String(product.name),
            quantity,
            unitPrice: price,
          };
        } catch (error) {
          if (error instanceof BadRequestException) throw error;

          throw new BadGatewayException(
            `Could not retrieve product ${productId}`,
          );
        }
      }),
    );

    const totalAmount = items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    );

    if (!Number.isFinite(totalAmount)) {
      throw new BadRequestException('Invalid order total');
    }

    const order = await this.db.$transaction(async (transaction) => {
      const createdOrder = await transaction.order.create({
        data: {
          userId,
          totalAmount: totalAmount.toFixed(2),
          status: 'PENDING',
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toFixed(2),
            })),
          },
        },
        include: { items: true },
      });

      await transaction.outboxEvent.create({
        data: {
          topic: 'stock.reserve',
          payload: {
            orderId: createdOrder.id,
            items: items.map(({ productId, quantity }) => ({
              productId,
              quantity,
            })),
          },
        },
      });

      return createdOrder;
    });

    return order;
  }

  async findAllOrders() {
    return this.db.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyOrders(userId: string) {
    return this.db.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.db.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) throw new BadRequestException('Order not found');
    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
  const order = await this.db.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) {
    throw new BadRequestException('Order not found');
  }

  if (order.status !== 'PENDING') {
    throw new BadRequestException(
      'Only pending orders can be cancelled',
    );
  }

  await this.db.$transaction(async (transaction) => {
    const updated = await transaction.order.updateMany({
      where: {
        id: orderId,
        userId,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    });

    if (updated.count === 0) {
      throw new BadRequestException('Order can no longer be cancelled');
    }

    await transaction.outboxEvent.create({
      data: {
        topic: 'stock.cancel',
        payload: {
          orderId: order.id,
          items: order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
    });
  });

  return {
    message: 'Order cancelled successfully',
    orderId: order.id,
    status: 'CANCELLED',
  };
}
}
