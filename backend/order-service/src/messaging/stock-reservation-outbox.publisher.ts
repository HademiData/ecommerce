import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { RabbitMQService } from './rabbitmq.service.js';

@Injectable()
export class StockReservationOutboxPublisher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(StockReservationOutboxPublisher.name);
  private timer?: ReturnType<typeof setInterval>;
  private publishing = false;

  constructor(
    private readonly database: DatabaseService,
    private readonly rabbitMQ: RabbitMQService,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => {
      void this.publishPending();
    }, 5000);
    void this.publishPending();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async publishPending(): Promise<void> {
    if (this.publishing) return;
    this.publishing = true;

    try {
      const events = await this.database.outboxEvent.findMany({
        where: { publishedAt: null },
        orderBy: { createdAt: 'asc' },
        take: 25,
      });

      for (const event of events) {
        try {
          await new Promise<void>((resolve, reject) => {
            this.rabbitMQ.getChannel().sendToQueue(
              event.topic,
              Buffer.from(JSON.stringify(event.payload)),
              {
                persistent: true,
                contentType: 'application/json',
              },
              (error) => (error ? reject(error) : resolve()),
            );
          });

          await this.database.outboxEvent.updateMany({
            where: { id: event.id, publishedAt: null },
            data: { publishedAt: new Date() },
          });
        } catch (error) {
          this.logger.warn(
            `Could not publish outbox event ${event.id}; it will be retried`,
            error instanceof Error ? error.stack : undefined,
          );
          break;
        }
      }
    } catch (error) {
      this.logger.error(
        'Could not read pending stock outbox events',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.publishing = false;
    }
  }
}
