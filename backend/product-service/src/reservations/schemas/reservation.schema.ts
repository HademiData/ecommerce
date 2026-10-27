
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReservationDocument = HydratedDocument<Reservation>;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ required: true, unique: true, index: true })
  orderId: string;

  @Prop({
    required: true,
    enum: ['PROCESSING', 'RESERVED', 'REJECTED'],
    default: 'PROCESSING',
  })
  status: string;

  @Prop({
    type: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    required: true,
  })
  items: Array<{
    productId: string;
    quantity: number;
  }>;

  @Prop()
  reason?: string;
}

export const ReservationSchema =
  SchemaFactory.createForClass(Reservation);
