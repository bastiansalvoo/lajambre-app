import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.product.findMany({
      include: { category: true },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    return product;
  }

  async updateImage(id: number, fileName: string) {
    const imageUrl = `http://localhost:3000/uploads/${fileName}`;

    return this.prisma.product.update({
      where: { id },
      data: { image: imageUrl },
    });
  }

  // Conectado a BD: Creación real de la hamburguesa
  async create(createProductDto: CreateProductDto) {
    return await this.prisma.product.create({
      data: createProductDto,
    });
  }

  // Conectado a BD: Actualización real
  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    return await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  // Conectado a BD: Eliminación real
  async remove(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    return await this.prisma.product.delete({
      where: { id },
    });
  }
}
