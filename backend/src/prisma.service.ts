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
    const pool = new Pool({
      // Forzamos que sea un string para que el driver no explote
      connectionString: process.env.DATABASE_URL || '',
    });

    const adapter = new PrismaPg(pool as any); // PrismaPg espera un Pool de pg, pero el tipo de PrismaClient es diferente, así que hacemos un cast 
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
