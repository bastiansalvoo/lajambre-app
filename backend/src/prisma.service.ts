import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. Creamos el Pool nativo de conexiones con la URL de tu .env
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 2. Lo conectamos al adaptador oficial
    const adapter = new PrismaPg(pool as any);

    // 3. Le entregamos el adaptador a Prisma 7
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log(
        '✅ [Lajambre-DB] Conexión exitosa a PostgreSQL usando Driver Adapter',
      );
    } catch (error) {
      console.error('❌ [Lajambre-DB] Error de conexión:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
