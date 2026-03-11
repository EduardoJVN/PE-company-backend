import { createAuthModule, type AuthModule } from '@infra/auth/module/auth.module.js';
import {
  createCompaniesModule,
  type CompaniesModule,
} from '@infra/companies/module/companies.module.js';

export interface AppModule {
  auth: AuthModule;
  companies: CompaniesModule;
}

export async function createAppModule(): Promise<AppModule> {
  const auth = await createAuthModule();
  const companies = createCompaniesModule();

  return { auth, companies };
}
