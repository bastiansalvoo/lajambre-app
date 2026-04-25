import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service'; // Asegúrate que el archivo sea categories.service.ts

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    // Al corregir el import de arriba, estos errores de "Unsafe" desaparecerán solos
    return await this.categoriesService.findAll();
  }
}
