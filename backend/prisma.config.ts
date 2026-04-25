import 'dotenv/config';
import { defineConfig } from '@prisma/config'; // <--- Cambia a este

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});
