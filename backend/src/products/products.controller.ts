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
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator'; // <-- IMPORTANTE: Importamos Roles

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 1. Crear producto (Solo Admin)
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN') // <-- Le decimos al guardia quién puede entrar
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // 2. Subir o actualizar imagen de un producto (Solo Admin)
  @Patch(':id/image')
  // 👇 COMENTAMOS LOS GUARDIAS TEMPORALMENTE HASTA QUE HAGAMOS EL LOGIN
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('image', {
      // <-- El backend espera la etiqueta 'image'
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Solo se permiten imágenes'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo no subido');
    return this.productsService.updateImage(id, file.filename);
  }

  // 3. Ver todos (Público)
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // 4. Ver uno solo (Público)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // 5. Editar datos (Solo Admin)
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // 6. Eliminar (Solo Admin)
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
