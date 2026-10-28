import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto.js';
export class UpdateProductDto extends PartialType(CreateProductDto) {
}
//# sourceMappingURL=update-product.dto.js.map