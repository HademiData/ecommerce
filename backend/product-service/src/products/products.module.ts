
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { Product, ProductSchema } from './schemas/product.schema.js';
import {
  Reservation,
  ReservationSchema,
} from '../reservations/schemas/reservation.schema.js';
import { InternalServiceGuard } from '../auth/internal-service.guard.js';
import { StockReservationConsumer } from '../messaging/stock-reservation.consumer.js';
import { RabbitMQService } from '../messaging/rabbitmq.service.js';

import {
  StockOperation,
  StockOperationSchema,
} from '../reservations/schemas/stock-operation.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: StockOperation.name, schema: StockOperationSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    InternalServiceGuard,
    RabbitMQService,
    StockReservationConsumer,
  ],
})
export class ProductsModule {}
