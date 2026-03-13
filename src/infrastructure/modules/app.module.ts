import { createAuthModule, type AuthModule } from '@infra/auth/module/auth.module.js';
import {
  createCompaniesModule,
  type CompaniesModule,
} from '@infra/companies/module/companies.module.js';
import {
  createProductsModule,
  type ProductsModule,
} from '@infra/products/module/products.module.js';

export interface AppModule {
  auth: AuthModule;
  companies: CompaniesModule;
  products: ProductsModule;
}

export async function createAppModule(): Promise<AppModule> {
  const auth = await createAuthModule();
  const companies = createCompaniesModule();
  const products = createProductsModule();

  return { auth, companies, products };
}
