var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { Product, ProductSchema } from './schemas/product.schema.js';
import { Reservation, ReservationSchema, } from '../reservations/schemas/reservation.schema.js';
import { InternalServiceGuard } from '../auth/internal-service.guard.js';
import { StockOperation, StockOperationSchema, } from '../reservations/schemas/stock-operation.schema.js';
let ProductsModule = class ProductsModule {
};
ProductsModule = __decorate([
    Module({
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
        ],
        exports: [ProductsService],
    })
], ProductsModule);
export { ProductsModule };
//# sourceMappingURL=products.module.js.map