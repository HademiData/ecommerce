
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Product, ProductDocument } from './schemas/product.schema.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto) {
    const existing = await this.productModel.exists({ sku: dto.sku });

    if (existing) {
      throw new ConflictException('SKU already exists');
    }

    return this.productModel.create(dto);
  }

  
async findAll(query: ProductQueryDto) {
  const {
    page,
    limit,
    category,
    search,
    sortBy,
    order,
  } = query;

  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const [products, total] = await Promise.all([
    this.productModel
      .find(filter)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    this.productModel.countDocuments(filter).exec(),
  ]);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async findOne(id: string) {

    this.validateId(id);
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {

    this.validateId(id);

    const product = await this.productModel
      .findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async remove(id: string) {

    this.validateId(id);
    const product = await this.productModel.findByIdAndDelete(id).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return { message: 'Product deleted successfully' };
  }

  private validateId(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid product ID');
    }
  }


  async reserveStock(id: string, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new BadRequestException('Quantity must be a positive integer');
    }

    const product = await this.productModel.findOneAndUpdate(
      {
        _id: id,
        isActive: true,
        stock: { $gte: quantity },
      },
      { $inc: { stock: -quantity } },
      { new: true, runValidators: true },
    );

    if (!product) {
      const exists = await this.productModel.exists({ _id: id });

      if (!exists) {
        throw new NotFoundException('Product not found');
      }

      throw new ConflictException('Insufficient stock or product unavailable');
    }

    return product;
  }

  async releaseStock(id: string, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new BadRequestException('Quantity must be a positive integer');
    }

    const product = await this.productModel.findOneAndUpdate(
      { _id: id },
      { $inc: { stock: quantity } },
      { new: true, runValidators: true },
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }


  async reserveStockForOrder(
  id: string,
  quantity: number,
  reservationId: string,
) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new BadRequestException('Invalid quantity');
  }

  const product = await this.productModel.findOneAndUpdate(
    {
      _id: id,
      isActive: true,
      stock: { $gte: quantity },
      appliedReservationIds: { $ne: reservationId },
      releasedReservationIds: { $ne: reservationId },
    },
    {
      $inc: { stock: -quantity },
      $addToSet: { appliedReservationIds: reservationId },
    },
    { new: true, runValidators: true },
  );

  if (product) return product;

  const existing = await this.productModel.findById(id);

  if (!existing) {
    throw new NotFoundException('Product not found');
  }

  if (existing.appliedReservationIds.includes(reservationId)) {
    return existing;
  }

  throw new ConflictException('Insufficient stock or reservation unavailable');
}

async releaseStockForOrder(
  id: string,
  quantity: number,
  reservationId: string,
) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new BadRequestException('Invalid quantity');
  }

  const product = await this.productModel.findOneAndUpdate(
    {
      _id: id,
      appliedReservationIds: reservationId,
      releasedReservationIds: { $ne: reservationId },
    },

    {
      $inc: { stock: quantity },
      $addToSet: { releasedReservationIds: reservationId },
    },
    { new: true, runValidators: true },
  );

  if (product) return product;

  const existing = await this.productModel.findById(id);

  if (!existing) {
    throw new NotFoundException('Product not found');
  }

  return existing;
}
}