import { DatabaseService } from '../database/database.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { ProductsService } from '../../../product-service/src/products/products.service.js';
export declare class OrdersService {
    private readonly db;
    private readonly products;
    private readonly logger;
    constructor(db: DatabaseService, products: ProductsService);
    create(userId: string, dto: CreateOrderDto): Promise<{
        items: {
            id: string;
            name: string;
            quantity: number;
            orderId: string;
            productId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAllOrders(): Promise<({
        items: {
            id: string;
            name: string;
            quantity: number;
            orderId: string;
            productId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findMyOrders(userId: string): Promise<({
        items: {
            id: string;
            name: string;
            quantity: number;
            orderId: string;
            productId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findOne(userId: string, orderId: string): Promise<{
        items: {
            id: string;
            name: string;
            quantity: number;
            orderId: string;
            productId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    cancelOrder(userId: string, orderId: string): Promise<{
        message: string;
        orderId: string;
        status: string;
    }>;
}
