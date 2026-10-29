import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { InternalServiceGuard } from '../auth/internal-service.guard.js';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
    }

    @Get()
    findAll(@Query() query: ProductQueryDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    remove(@Param('id') id: string) {
    return this.productsService.remove(id);
    }


        
    @Post(':id/reserve')
    @UseGuards(InternalServiceGuard)
    reserveStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    ) {
    return this.productsService.reserveStock(id, quantity);
    }

    @Post(':id/release')
    @UseGuards(InternalServiceGuard)
    releaseStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    ) {
    return this.productsService.releaseStock(id, quantity);
    }

    @Post(':id/reserve-order')
    @UseGuards(InternalServiceGuard)
    reserveStockForOrder(
      @Param('id') id: string,
      @Body() body: { quantity: number; reservationId: string },
    ) {
      return this.productsService.reserveStockForOrder(
        id,
        body.quantity,
        body.reservationId,
      );
    }

    @Post(':id/release-order')
    @UseGuards(InternalServiceGuard)
    releaseStockForOrder(
      @Param('id') id: string,
      @Body() body: { quantity: number; reservationId: string },
    ) {
      return this.productsService.releaseStockForOrder(
        id,
        body.quantity,
        body.reservationId,
      );
    }

}
