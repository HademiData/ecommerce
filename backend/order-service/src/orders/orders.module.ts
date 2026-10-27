import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

import { RabbitMQService } from '../messaging/rabbitmq.service.js';
import { StockResultConsumer } from '../messaging/stock-result.consumer.js';
import { StockReservationOutboxPublisher } from '../messaging/stock-reservation-outbox.publisher.js';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    RabbitMQService,
    StockResultConsumer,
    StockReservationOutboxPublisher,
  ],
})
export class OrdersModule {}
