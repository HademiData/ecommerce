import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { ProductsClient } from './products.client.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, ProductsClient],
})
export class OrdersModule {}
