
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class StockOperation {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({
    required: true,
    enum: ['PENDING', 'APPLIED', 'RELEASED'],
    default: 'PENDING',
  })
  status: string;
}

export const StockOperationSchema =
  SchemaFactory.createForClass(StockOperation);

StockOperationSchema.index(
  { orderId: 1, productId: 1 },
  { unique: true },
);
