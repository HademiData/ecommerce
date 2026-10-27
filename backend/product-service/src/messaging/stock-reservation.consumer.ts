import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RabbitMQService } from './rabbitmq.service.js';
import { ProductsService } from '../products/products.service.js';
import { Reservation } from '../reservations/schemas/reservation.schema.js';

interface StockReservationMessage {
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

@Injectable()
export class StockReservationConsumer
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(StockReservationConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly productsService: ProductsService,
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<Reservation>,
  ) {}

  private async publishResult(result: {
    orderId: string;
    success: boolean;
    reason?: string;
  }): Promise<void> {
    const channel = this.rabbitMQ.getChannel();

    await new Promise<void>((resolve, reject) => {
      channel.sendToQueue(
        'stock.result',
        Buffer.from(JSON.stringify(result)),
        {
          persistent: true,
          contentType: 'application/json',
        },
        (error) => (error ? reject(error) : resolve()),
      );
    });
  }

  private async releaseItems(
    orderId: string,
    items: StockReservationMessage['items'],
  ): Promise<void> {
    for (const item of items) {
      await this.productsService.releaseStockForOrder(
        item.productId,
        item.quantity,
        `${orderId}:${item.productId}`,
      );
    }
  }

  private isValidRequest(
    request: StockReservationMessage,
  ): boolean {
    return (
      Boolean(request.orderId) &&
      Array.isArray(request.items) &&
      request.items.length > 0 &&
      request.items.every(
        (item) =>
          Boolean(item.productId) &&
          Number.isSafeInteger(item.quantity) &&
          item.quantity > 0,
      )
    );
  }

  private async handleCancellation(
    request: StockReservationMessage,
  ): Promise<void> {
    try {
      await this.reservationModel.findOneAndUpdate(
        { orderId: request.orderId },
        {
          $setOnInsert: {
            orderId: request.orderId,
            items: request.items,
            status: 'REJECTED',
            reason: 'Cancelled by customer',
          },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      if (
        !error ||
        typeof error !== 'object' ||
        !('code' in error) ||
        error.code !== 11000
      ) {
        throw error;
      }
    }

    await this.reservationModel.updateOne(
      {
        orderId: request.orderId,
        status: { $in: ['PROCESSING', 'RESERVED'] },
      },
      {
        $set: {
          status: 'REJECTED',
          reason: 'Cancelled by customer',
        },
      },
    );

    const reservation = await this.reservationModel.findOne({
      orderId: request.orderId,
    });

    if (!reservation) {
      throw new Error('Could not find cancellation reservation');
    }

    await this.releaseItems(request.orderId, reservation.items);

    await this.publishResult({
      orderId: request.orderId,
      success: false,
      reason: 'Cancelled by customer',
    });

    this.logger.log(`Stock cancellation processed for ${request.orderId}`);
  }

  async onApplicationBootstrap(): Promise<void> {
    const channel = this.rabbitMQ.getChannel();

    await channel.assertQueue('stock.reserve', {
      durable: true,
    });

    await channel.assertQueue('stock.cancel', {
      durable: true,
    });

    await channel.prefetch(1);

    await channel.consume('stock.reserve', async (message) => {
      if (!message) return;

      let request: StockReservationMessage | undefined;

      try {
        request = JSON.parse(
          message.content.toString(),
        ) as StockReservationMessage;

        if (!this.isValidRequest(request)) {
          channel.ack(message);
          this.logger.warn('Discarded invalid reservation message');
          return;
        }

        const reservation = await this.reservationModel.findOneAndUpdate(
          { orderId: request.orderId },
          {
            $setOnInsert: {
              orderId: request.orderId,
              items: request.items,
              status: 'PROCESSING',
            },
          },
          { upsert: true, new: true },
        );

        if (reservation.status === 'REJECTED') {
          await this.releaseItems(request.orderId, reservation.items);

          await this.publishResult({
            orderId: request.orderId,
            success: false,
            reason: reservation.reason ?? 'Stock reservation rejected',
          });

          channel.ack(message);
          return;
        }

        if (reservation.status === 'RESERVED') {
          await this.publishResult({
            orderId: request.orderId,
            success: true,
          });

          channel.ack(message);
          return;
        }

        try {
          for (const item of reservation.items) {
            await this.productsService.reserveStockForOrder(
              item.productId,
              item.quantity,
              `${request.orderId}:${item.productId}`,
            );
          }

          const updated = await this.reservationModel.updateOne(
            {
              orderId: request.orderId,
              status: 'PROCESSING',
            },
            { $set: { status: 'RESERVED' } },
          );

          if (updated.modifiedCount === 0) {
            await this.releaseItems(request.orderId, reservation.items);

            await this.publishResult({
              orderId: request.orderId,
              success: false,
              reason: 'Reservation was cancelled',
            });

            channel.ack(message);
            return;
          }
        } catch (error) {
          const reason =
            error instanceof Error
              ? error.message
              : 'Stock reservation failed';

          await this.reservationModel.updateOne(
            {
              orderId: request.orderId,
              status: 'PROCESSING',
            },
            {
              $set: {
                status: 'REJECTED',
                reason,
              },
            },
          );

          await this.releaseItems(request.orderId, reservation.items);

          await this.publishResult({
            orderId: request.orderId,
            success: false,
            reason,
          });

          channel.ack(message);
          return;
        }

        await this.publishResult({
          orderId: request.orderId,
          success: true,
        });

        channel.ack(message);

        this.logger.log(`Stock reserved for order ${request.orderId}`);
      } catch (error) {
        this.logger.error(
          `Reservation processing failed${
            request?.orderId ? ` for ${request.orderId}` : ''
          }`,
          error instanceof Error ? error.stack : undefined,
        );

        channel.nack(message, false, true);
      }
    });

    await channel.consume('stock.cancel', async (message) => {
      if (!message) return;

      try {
        const request = JSON.parse(
          message.content.toString(),
        ) as StockReservationMessage;

        if (!this.isValidRequest(request)) {
          channel.ack(message);
          this.logger.warn('Discarded invalid cancellation message');
          return;
        }

        await this.handleCancellation(request);
        channel.ack(message);
      } catch (error) {
        this.logger.error(
          'Stock cancellation processing failed',
          error instanceof Error ? error.stack : undefined,
        );

        channel.nack(message, false, true);
      }
    });

    this.logger.log('Listening for stock reservations and cancellations');
  }
}