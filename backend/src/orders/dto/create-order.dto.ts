import {
  IsArray,
  IsNumber,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  extraIds?: number[]; // Lista de IDs de los extras (carne extra, etc.)
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  address: string;

  @IsString()
  phone: string;
}
