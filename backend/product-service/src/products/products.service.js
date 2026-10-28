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
import { Injectable, NotFoundException, ConflictException, BadRequestException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema.js';
let ProductsService = class ProductsService {
    productModel;
    constructor(productModel) {
        this.productModel = productModel;
    }
    async create(dto) {
        const existing = await this.productModel.exists({ sku: dto.sku });
        if (existing) {
            throw new ConflictException('SKU already exists');
        }
        return this.productModel.create(dto);
    }
    async findAll(query) {
        const { page, limit, category, search, sortBy, order, } = query;
        const filter = {
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
    async findOne(id) {
        this.validateId(id);
        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }
    async update(id, dto) {
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
    async remove(id) {
        this.validateId(id);
        const product = await this.productModel.findByIdAndDelete(id).exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return { message: 'Product deleted successfully' };
    }
    validateId(id) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid product ID');
        }
    }
    async reserveStock(id, quantity) {
        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            throw new BadRequestException('Quantity must be a positive integer');
        }
        const product = await this.productModel.findOneAndUpdate({
            _id: id,
            isActive: true,
            stock: { $gte: quantity },
        }, { $inc: { stock: -quantity } }, { new: true, runValidators: true });
        if (!product) {
            const exists = await this.productModel.exists({ _id: id });
            if (!exists) {
                throw new NotFoundException('Product not found');
            }
            throw new ConflictException('Insufficient stock or product unavailable');
        }
        return product;
    }
    async releaseStock(id, quantity) {
        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            throw new BadRequestException('Quantity must be a positive integer');
        }
        const product = await this.productModel.findOneAndUpdate({ _id: id }, { $inc: { stock: quantity } }, { new: true, runValidators: true });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }
    async reserveStockForOrder(id, quantity, reservationId) {
        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            throw new BadRequestException('Invalid quantity');
        }
        const product = await this.productModel.findOneAndUpdate({
            _id: id,
            isActive: true,
            stock: { $gte: quantity },
            appliedReservationIds: { $ne: reservationId },
            releasedReservationIds: { $ne: reservationId },
        }, {
            $inc: { stock: -quantity },
            $addToSet: { appliedReservationIds: reservationId },
        }, { new: true, runValidators: true });
        if (product)
            return product;
        const existing = await this.productModel.findById(id);
        if (!existing) {
            throw new NotFoundException('Product not found');
        }
        if (existing.appliedReservationIds.includes(reservationId)) {
            return existing;
        }
        throw new ConflictException('Insufficient stock or reservation unavailable');
    }
    async releaseStockForOrder(id, quantity, reservationId) {
        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            throw new BadRequestException('Invalid quantity');
        }
        const product = await this.productModel.findOneAndUpdate({
            _id: id,
            appliedReservationIds: reservationId,
            releasedReservationIds: { $ne: reservationId },
        }, {
            $inc: { stock: quantity },
            $addToSet: { releasedReservationIds: reservationId },
        }, { new: true, runValidators: true });
        if (product)
            return product;
        const existing = await this.productModel.findById(id);
        if (!existing) {
            throw new NotFoundException('Product not found');
        }
        return existing;
    }
};
ProductsService = __decorate([
    Injectable(),
    __param(0, InjectModel(Product.name)),
    __metadata("design:paramtypes", [Model])
], ProductsService);
export { ProductsService };
//# sourceMappingURL=products.service.js.map