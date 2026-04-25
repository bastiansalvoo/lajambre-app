import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string; // El ! quita el error de inicialización

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number) // <--- CRÍTICO: Convierte "8990" de FormData a número real
  @IsNumber()
  price!: number;

  @Type(() => Number) // <--- CRÍTICO: Convierte "1" de FormData a número real
  @IsNumber()
  categoryId!: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
