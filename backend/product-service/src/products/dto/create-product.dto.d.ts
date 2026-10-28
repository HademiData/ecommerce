export declare class CreateProductDto {
    name: string;
    description: string;
    price: number;
    category: string;
    sku: string;
    stock: number;
    images?: string[];
    badge?: string;
    isActive?: boolean;
}
