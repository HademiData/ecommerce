import { HydratedDocument } from 'mongoose';
export type ReservationDocument = HydratedDocument<Reservation>;
export declare class Reservation {
    orderId: string;
    status: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    reason?: string;
}
export declare const ReservationSchema: import("mongoose").Schema<Reservation, import("mongoose").Model<Reservation, any, any, any, any, any, Reservation & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Reservation, import("mongoose").Document<unknown, {}, Reservation, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Reservation & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    orderId?: import("mongoose").SchemaDefinitionProperty<string, Reservation, import("mongoose").Document<unknown, {}, Reservation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Reservation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Reservation, import("mongoose").Document<unknown, {}, Reservation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Reservation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    items?: import("mongoose").SchemaDefinitionProperty<{
        productId: string;
        quantity: number;
    }[], Reservation, import("mongoose").Document<unknown, {}, Reservation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Reservation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Reservation, import("mongoose").Document<unknown, {}, Reservation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Reservation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Reservation>;
