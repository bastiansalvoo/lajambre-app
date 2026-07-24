// src/extras/extras.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ExtrasService } from './extras.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateExtraDto } from './dto/create-extra.dto'; // Asegúrate de que la ruta coincida

@Controller('extras')
export class ExtrasController {
  constructor(private readonly extrasService: ExtrasService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN') // Solo Angelo (Admin) puede crear
  create(@Body() createExtraDto: CreateExtraDto) {
    return this.extrasService.create(createExtraDto);
  }

  // Lista completa (incluye agregados deshabilitados): solo para el panel de admin.
  // El público usa /products/extras/all, que filtra por isAvailable.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.extrasService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateData: { name?: string; price?: number; isAvailable?: boolean },
  ) {
    return this.extrasService.update(id, updateData); // Asegúrate de que tu extrasService tenga un método update que maneje esto
  }
}
