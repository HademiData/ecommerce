import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { DatabaseModule as UserDatabaseModule } from '../database/database.module.js';
import { AuthModule as ProductAuthModule } from '../../../product-service/src/auth/auth.module.js';
import { ProductsModule } from '../../../product-service/src/products/products.module.js';
import { DatabaseModule as OrderDatabaseModule } from '../../../order-service/src/database/database.module.js';
import { AuthModule as OrderAuthModule } from '../../../order-service/src/auth/auth.module.js';
import { OrdersModule } from '../../../order-service/src/orders/orders.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        '../../.env',
        '../product-service/.env',
        '../order-service/.env',
      ],
    }),
    UserDatabaseModule,
    UsersModule,
    AuthModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    ProductAuthModule,
    ProductsModule,
    OrderDatabaseModule,
    OrderAuthModule,
    OrdersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
