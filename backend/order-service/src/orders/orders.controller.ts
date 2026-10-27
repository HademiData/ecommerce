import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from  '../auth/jwt-auth.guard.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user?.sub ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.ordersService.create(userId, dto);
  }

  @Get()
  findMyOrders(@Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.ordersService.findMyOrders(userId);
  }

  @Get('admin')
  findAllOrders(@Req() req: any) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    return this.ordersService.findAllOrders();
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') orderId: string) {
    const userId = req.user?.sub ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.ordersService.findOne(userId, orderId);
  }

  @Post(':id/cancel')
  cancelOrder(@Req() req: any, @Param('id') orderId: string) {
    const userId = req.user?.sub ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.ordersService.cancelOrder(userId, orderId);
  }
}
