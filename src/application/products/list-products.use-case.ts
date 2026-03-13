import type { PaginatedResult, PaginationQuery } from '@shared/dto/pagination.dto.js';
import { toPaginatedResult, toOffset } from '@shared/dto/pagination.dto.js';
import type {
  IProductRepository,
  ListProductsFilter,
  ProductResult,
} from '@domain/products/ports/product-repository.port.js';

export interface ListProductsInput extends PaginationQuery {
  companyId: string;
  filter: ListProductsFilter;
}

export class ListProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(input: ListProductsInput): Promise<PaginatedResult<ProductResult>> {
    const offset = toOffset(input);
    const { data, total } = await this.productRepo.findAll(
      input.companyId,
      input.filter,
      input.limit,
      offset,
    );
    return toPaginatedResult(data, total, input);
  }
}
