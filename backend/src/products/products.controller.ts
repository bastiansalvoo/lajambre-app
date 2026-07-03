import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Configuración compartida del fileFilter y límite de tamaño para imágenes
const imageUploadOptions = {
  fileFilter: (req: any, file: Express.Multer.File, callback: Function) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return callback(
        new BadRequestException('Solo se permiten imágenes .jpg, .png o .webp'),
        false,
      );
    }
    callback(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5MB
};

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 1. Crear producto con imagen (🔒 SOLO ADMIN)
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      ...imageUploadOptions,
    }),
  )
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const productData = {
      ...createProductDto,
      image: file ? file.filename : null,
    };
    return this.productsService.create(productData);
  }

  // 2. Actualizar imagen existente (🔒 SOLO ADMIN)
  @Patch(':id/image')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      ...imageUploadOptions,
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo no subido');
    return this.productsService.updateImage(id, file.filename);
  }

  // 3. Ver todos (🌍 PÚBLICO o 🔒 ADMIN)
  @Get()
  findAll(@Query('admin') isAdmin?: boolean) {
    // Si viene ?admin=true, el servicio traerá todos (incluyendo los ocultos)
    return this.productsService.findAll(isAdmin);
  }

  // 🌍 PÚBLICO: Obtener extras disponibles
  @Get('extras/all')
  findAllExtras() {
    return this.productsService.findAllExtras();
  }

  // 4. Ver uno solo (🌍 PÚBLICO)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // 5. Editar datos (🔒 SOLO ADMIN)
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // 6. Eliminar (🔒 SOLO ADMIN)
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
