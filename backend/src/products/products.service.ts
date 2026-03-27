import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  // 1. Tipamos explícitamente el constructor
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // 2. Aquí es donde ESLint se queja. Forzamos el await.
    const products = await this.prisma.product.findMany({
      include: { category: true },
    });
    return products;
  }

  async findOne(id: number) {
    return await this.prisma.product.findUnique({
      where: { id },
    });
  }

  async updateImage(id: number, fileName: string) {
    // Generamos la URL accesible (asumiendo que el server corre en el 3000)
    const imageUrl = `http://localhost:3000/uploads/${fileName}`;

    return this.prisma.product.update({
      where: { id },
      data: { image: imageUrl },
    });
  }

  // Los métodos de abajo son para Angelo, los dejamos limpios para el linter
  create(createProductDto: CreateProductDto) {
    return { message: 'Creando...', data: createProductDto };
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return { message: `Actualizando #${id}`, data: updateProductDto };
  }

  remove(id: number) {
    return `Eliminado #${id}`;
  }
}
