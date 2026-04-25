import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma.service'; // Asegúrate de que la ruta sea correcta

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService],
  exports: [CategoriesService], // Por si otro módulo lo necesita
})
export class CategoriesModule {}
