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

  @Get()
  // Generalmente el GET es público o para cualquier usuario logueado
  findAll() {
    return this.extrasService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.extrasService.updateAvailability(id, isAvailable);
  }
}
