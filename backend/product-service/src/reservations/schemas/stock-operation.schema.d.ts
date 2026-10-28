export declare class StockOperation {
    orderId: string;
    productId: string;
    quantity: number;
    status: string;
}
export declare const StockOperationSchema: import("mongoose").Schema<StockOperation, import("mongoose").Model<StockOperation, any, any, any, any, any, StockOperation & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StockOperation, import("mongoose").Document<unknown, {}, StockOperation, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<StockOperation & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    orderId?: import("mongoose").SchemaDefinitionProperty<string, StockOperation, import("mongoose").Document<unknown, {}, StockOperation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StockOperation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    productId?: import("mongoose").SchemaDefinitionProperty<string, StockOperation, import("mongoose").Document<unknown, {}, StockOperation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StockOperation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    quantity?: import("mongoose").SchemaDefinitionProperty<number, StockOperation, import("mongoose").Document<unknown, {}, StockOperation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StockOperation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, StockOperation, import("mongoose").Document<unknown, {}, StockOperation, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StockOperation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, StockOperation>;
