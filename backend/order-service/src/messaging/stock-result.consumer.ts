
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service.js';
import { DatabaseService } from '../database/database.service.js';

interface StockResultMessage {
  orderId: string;
  success: boolean;
  reason?: string;
}

@Injectable()
export class StockResultConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(StockResultConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly database: DatabaseService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const channel = this.rabbitMQ.getChannel();

    await channel.prefetch(1);

    await channel.consume('stock.result', async (message) => {
      if (!message) return;

      try {
        const result = JSON.parse(
          message.content.toString(),
        ) as StockResultMessage;

        if (
          !result.orderId ||
          typeof result.success !== 'boolean'
        ) {
          channel.ack(message);
          this.logger.warn('Discarded invalid stock result');
          return;
        }

        await this.database.order.updateMany({
          where: {
            id: result.orderId,
            status: 'PENDING',
          },
          data: {
            status: result.success ? 'CONFIRMED' : 'CANCELLED',
          },
        });

        channel.ack(message);

        this.logger.log(
          `Order ${result.orderId}: ${
            result.success ? 'CONFIRMED' : 'CANCELLED'
          }`,
        );
      } catch (error) {
        this.logger.error('Failed to process stock result', error);
        channel.nack(message, false, true);
      }
    });

    this.logger.log('Listening for stock results');
  }
}