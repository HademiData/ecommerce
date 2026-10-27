import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ConfirmChannel, ChannelModel } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('RABBITMQ_URL');

    if (!url) {
      throw new ServiceUnavailableException(
        'RABBITMQ_URL is not configured',
      );
    }

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createConfirmChannel();

    await this.channel.assertQueue('stock.reserve', { durable: true });
    await this.channel.assertQueue('stock.result', { durable: true });

    this.logger.log('Connected to RabbitMQ with publisher confirms');
  }

  getChannel(): ConfirmChannel {
    if (!this.channel) {
      throw new ServiceUnavailableException(
        'RabbitMQ is not connected',
      );
    }

    return this.channel;
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
