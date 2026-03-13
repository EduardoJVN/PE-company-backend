import { prisma } from '@infra/config/prisma.js';
import { PrismaProductRepository } from '@infra/products/adapters/prisma-product.repository.js';
import { CreateProductUseCase } from '@application/products/create-product.use-case.js';
import { ListProductsUseCase } from '@application/products/list-products.use-case.js';
import { GetProductUseCase } from '@application/products/get-product.use-case.js';
import { UpdateProductUseCase } from '@application/products/update-product.use-case.js';
import { ProductController } from '@infra/products/entry-points/product.controller.js';

export interface ProductsModule {
  productController: ProductController;
}

export function createProductsModule(): ProductsModule {
  const productRepo = new PrismaProductRepository(prisma);
  const createProductUseCase = new CreateProductUseCase(productRepo);
  const listProductsUseCase = new ListProductsUseCase(productRepo);
  const getProductUseCase = new GetProductUseCase(productRepo);
  const updateProductUseCase = new UpdateProductUseCase(productRepo);
  const productController = new ProductController(
    createProductUseCase,
    listProductsUseCase,
    getProductUseCase,
    updateProductUseCase,
  );

  return { productController };
}
