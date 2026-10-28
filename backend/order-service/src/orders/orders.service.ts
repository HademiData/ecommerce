
import {
  BadRequestException,
  InternalServerErrorException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { ProductsService } from '../../../product-service/src/products/products.service.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly products: ProductsService,
  ) {}

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
        const product = await this.products.findOne(productId);
        const price = Number(product.price);

        if (
          !product.isActive ||
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
      }),
    );

    const totalAmount = items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    );

    if (!Number.isFinite(totalAmount)) {
      throw new BadRequestException('Invalid order total');
    }

    const order = await this.db.$transaction((transaction) =>
      transaction.order.create({
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
      }),
    );

    const reservedItems: typeof items = [];

    try {
      for (const item of items) {
        await this.products.reserveStockForOrder(
          item.productId,
          item.quantity,
          order.id,
        );
        reservedItems.push(item);
      }

      return this.db.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
        include: { items: true },
      });
    } catch (error) {
      try {
        for (const item of reservedItems) {
          await this.products.releaseStockForOrder(
            item.productId,
            item.quantity,
            order.id,
          );
        }

        await this.db.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });
      } catch (rollbackError) {
        this.logger.error(
          `Could not restore inventory for failed order ${order.id}`,
          rollbackError instanceof Error ? rollbackError.stack : undefined,
        );
        throw new InternalServerErrorException(
          'Order failed and inventory could not be restored',
          { cause: rollbackError },
        );
      }

      throw error;
    }
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

  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    throw new BadRequestException(
      'Only pending or confirmed orders can be cancelled',
    );
  }

  for (const item of order.items) {
    await this.products.releaseStockForOrder(
      item.productId,
      item.quantity,
      order.id,
    );
  }

  const updated = await this.db.order.updateMany({
    where: {
      id: orderId,
      userId,
      status: order.status,
    },
    data: { status: 'CANCELLED' },
  });

  if (updated.count === 0) {
    throw new BadRequestException('Order can no longer be cancelled');
  }

  return {
    message: 'Order cancelled successfully',
    orderId: order.id,
    status: 'CANCELLED',
  };
}
}
