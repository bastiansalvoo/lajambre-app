import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(isAdmin?: boolean) {
    const products = await this.prisma.product.findMany({
      where: isAdmin ? {} : { isAvailable: true }, // Admin ve todo, público solo disponibles
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    return products.map((p) => ({
      ...p,
      image: p.image ? `/uploads/${p.image}` : null,
    }));
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
    // 👇 Guardamos SOLO el nombre del archivo en Prisma (ej: product-123.jpg)
    return this.prisma.product.update({
      where: { id },
      data: { image: fileName },
    });
  }

  // Conectado a BD: Creación real de la hamburguesa
  async create(data: CreateProductDto & { image?: string | null }) {
    return await this.prisma.product.create({
      data: data, // Ahora TS sabe que 'data' es seguro y usa el DTO
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

  async findAllExtras() {
    return this.prisma.extra.findMany({
      where: { isAvailable: true },
    });
  }
}
