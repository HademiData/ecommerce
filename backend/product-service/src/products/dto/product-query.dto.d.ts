export declare class ProductQueryDto {
    page: number;
    limit: number;
    category?: string;
    search?: string;
    sortBy: 'price' | 'createdAt' | 'name';
    order: 'asc' | 'desc';
}
