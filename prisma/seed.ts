import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const userId = uuidv7();
  const password = await bcrypt.hash('Ab12345678$', 12);
  console.log('password hasheado:', password); // eslint-disable-line
  console.log('--- Iniciando Seed con SQL Nativo ---'); // eslint-disable-line

  // Usamos una transacción para asegurarnos de que todo se inserte o nada
  await prisma.$transaction(async (tx) => {
    // 1. Limpiar tablas (opcional, por si quieres re-ejecutarlo)
    // TRUNCATE elimina los datos y reinicia contadores de ID
    await tx.$executeRawUnsafe(
      `TRUNCATE TABLE "user_roles", "user_status", "register_types", "company_member_roles", categories, category_spec_definitions RESTART IDENTITY CASCADE;`,
    );

    // 2. Insertar Roles de Usuario con IDs fijos
    await tx.$executeRawUnsafe(`
      INSERT INTO "user_roles" (id, name, created_at, updated_at) VALUES
      (1, 'USER', NOW(), NOW()),
      (2, 'ADMIN', NOW(), NOW()),
      (3, 'SUPPORT', NOW(), NOW());
    `);

    // 3. Insertar Estados de Usuario
    // si es change password es porque fue invitado por un admin y debe cambiar su contraseña para activar su cuenta
    await tx.$executeRawUnsafe(`
      INSERT INTO "user_status" (id, name, created_at, updated_at) VALUES
      (1, 'PENDING', NOW(), NOW()),
      (2, 'ACTIVE', NOW(), NOW()),
      (3, 'SUSPENDED', NOW(), NOW()),
      (4, 'CHANGE_PASSWORD', NOW(), NOW()), 
      (5, 'INACTIVE', NOW(), NOW());
    `);

    // 4. Insertar Tipos de Registro
    await tx.$executeRawUnsafe(`
      INSERT INTO "register_types" (id, name, created_at, updated_at) VALUES
      (1, 'EMAIL', NOW(), NOW()),
      (2, 'GOOGLE', NOW(), NOW()),  
      (3, 'FACEBOOK', NOW(), NOW());
`);

    // 5. Roles de Miembros de Empresa (Pivot Table Roles)
    await tx.$executeRawUnsafe(`
      INSERT INTO "company_member_roles" (id, name, created_at, updated_at) VALUES
      (1, 'OWNER', NOW(), NOW()),
      (2, 'ADMIN', NOW(), NOW()),
      (3, 'EDITOR', NOW(), NOW()),
      (4, 'VIEWER', NOW(), NOW());
    `);

    // 3. Insertar Estados de companies
    await tx.$executeRawUnsafe(`
      INSERT INTO "company_status" (id, name, created_at, updated_at) VALUES
      (1, 'ACTIVE', NOW(), NOW()),
      (2, 'PENDING_VERIFIED', NOW(), NOW()),
      (3, 'VERIFIED', NOW(), NOW()),
      (4, 'SUSPENDED', NOW(), NOW()),
      (5, 'INACTIVE', NOW(), NOW());
    `);

    // 3. Insertar Estados de miembros de empresa
    await tx.$executeRawUnsafe(`
      INSERT INTO "company_member_status" (id, name, created_at, updated_at) VALUES
      (1, 'PENDING', NOW(), NOW()),
      (2, 'ACTIVE', NOW(), NOW()),
      (3, 'SUSPENDED', NOW(), NOW()),
      (4, 'INACTIVE', NOW(), NOW()),
      (5, 'REJECTED', NOW(), NOW()),
      (6, 'DELETED', NOW(), NOW());
    `);

    // 6. sectores de empresas
    await tx.$executeRawUnsafe(`
      INSERT INTO "industry_types" (id, name, created_at, updated_at) VALUES
      (1, 'TECNOLOGIA', NOW(), NOW()),
      (2, 'PASTELERIA', NOW(), NOW()),
      (3, 'COMIDA', NOW(), NOW()),
      (4, 'SALUD', NOW(), NOW());
    `);

    // 2. Insertar usuario de prueba
    await tx.$executeRawUnsafe(`
      INSERT INTO "users" (id, email, password, status_id, role_id, register_type_id, is_active, created_at, updated_at) VALUES
      ('${userId}', 'user@email.com', '${password}', 2, 1, 1, true, NOW(), NOW());
    `);

    // inserta categories

    // category lvl 1
    await tx.$executeRawUnsafe(`
      INSERT INTO "categories" (id, name, slug , parent_id , created_at, updated_at) VALUES
      (1, 'Tecnología', '/tecnologia', NULL, NOW(), NOW()),
      (2, 'Hogar y muebles', '/hogar', NULL, NOW(), NOW()),
      (3, 'Comida', '/comida', NULL, NOW(), NOW());
     
    `);

    // category lvl 2
    await tx.$executeRawUnsafe(`
      INSERT INTO "categories" (id, name, slug , parent_id , created_at, updated_at) VALUES
       (4, 'Celulares y Teléfonos', '/celulares-telefonos', 1, NOW(), NOW()),
       (5, 'Computación', '/computacion', 1, NOW(), NOW()),
       (6, 'Cocina y bazar', '/cocina-bazar', 2, NOW(), NOW());
    `);

    // category lvl 3
    await tx.$executeRawUnsafe(`
      INSERT INTO "categories" (id, name, slug , parent_id , created_at, updated_at) VALUES
       (7, 'Accesorios para Celulares', '/accesorios-celulares', 4, NOW(), NOW());
    `);

    // specs de categoria
    await tx.$executeRawUnsafe(`
      INSERT INTO "category_spec_definitions" (id, category_id, name, label , options ,created_at, updated_at) VALUES
      (1, 4 ,'color', 'Color', '["Negro", "Azul", "Rojo"]', NOW(), NOW()),
      (2, 4 ,'ram', 'Memoria ram', '["8GB", "16GB", "32GB"]', NOW(), NOW());
    `);

    console.log('✅ Catálogos insertados con IDs fijos.'); // eslint-disable-line
  });
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
