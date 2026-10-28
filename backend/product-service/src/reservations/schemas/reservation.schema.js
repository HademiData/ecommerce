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
let Reservation = class Reservation {
    orderId;
    status;
    items;
    reason;
};
__decorate([
    Prop({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Reservation.prototype, "orderId", void 0);
__decorate([
    Prop({
        required: true,
        enum: ['PROCESSING', 'RESERVED', 'REJECTED'],
        default: 'PROCESSING',
    }),
    __metadata("design:type", String)
], Reservation.prototype, "status", void 0);
__decorate([
    Prop({
        type: [
            {
                productId: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
            },
        ],
        required: true,
    }),
    __metadata("design:type", Array)
], Reservation.prototype, "items", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Reservation.prototype, "reason", void 0);
Reservation = __decorate([
    Schema({ timestamps: true })
], Reservation);
export { Reservation };
export const ReservationSchema = SchemaFactory.createForClass(Reservation);
//# sourceMappingURL=reservation.schema.js.map