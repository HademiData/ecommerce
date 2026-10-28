var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
let StockOperation = class StockOperation {
    orderId;
    productId;
    quantity;
    status;
};
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], StockOperation.prototype, "orderId", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], StockOperation.prototype, "productId", void 0);
__decorate([
    Prop({ required: true, min: 1 }),
    __metadata("design:type", Number)
], StockOperation.prototype, "quantity", void 0);
__decorate([
    Prop({
        required: true,
        enum: ['PENDING', 'APPLIED', 'RELEASED'],
        default: 'PENDING',
    }),
    __metadata("design:type", String)
], StockOperation.prototype, "status", void 0);
StockOperation = __decorate([
    Schema({ timestamps: true })
], StockOperation);
export { StockOperation };
export const StockOperationSchema = SchemaFactory.createForClass(StockOperation);
StockOperationSchema.index({ orderId: 1, productId: 1 }, { unique: true });
//# sourceMappingURL=stock-operation.schema.js.map