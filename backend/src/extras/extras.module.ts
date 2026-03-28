import { Module } from '@nestjs/common';
import { ExtrasService } from './extras.service';
import { ExtrasController } from './extras.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ExtrasController],
  providers: [ExtrasService, PrismaService],
  exports: [ExtrasService],
})
export class ExtrasModule {}
