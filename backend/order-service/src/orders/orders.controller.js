var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UnauthorizedException, UseGuards, } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    create(req, dto) {
        const userId = req.user?.sub ?? req.user?.id;
        if (!userId) {
            throw new UnauthorizedException();
        }
        return this.ordersService.create(userId, dto);
    }
    findMyOrders(req) {
        const userId = req.user?.sub ?? req.user?.id;
        if (!userId) {
            throw new UnauthorizedException();
        }
        return this.ordersService.findMyOrders(userId);
    }
    findAllOrders(req) {
        if (req.user?.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.ordersService.findAllOrders();
    }
    findOne(req, orderId) {
        const userId = req.user?.sub ?? req.user?.id;
        if (!userId) {
            throw new UnauthorizedException();
        }
        return this.ordersService.findOne(userId, orderId);
    }
    cancelOrder(req, orderId) {
        const userId = req.user?.sub ?? req.user?.id;
        if (!userId) {
            throw new UnauthorizedException();
        }
        return this.ordersService.cancelOrder(userId, orderId);
    }
};
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findMyOrders", null);
__decorate([
    Get('admin'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findAllOrders", null);
__decorate([
    Get(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    Post(':id/cancel'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "cancelOrder", null);
OrdersController = __decorate([
    Controller('orders'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [OrdersService])
], OrdersController);
export { OrdersController };
//# sourceMappingURL=orders.controller.js.map