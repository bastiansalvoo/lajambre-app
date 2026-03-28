import {
  IsArray,
  IsNumber,
  IsString,
  IsOptional,
  ValidateNested,
  IsIn,
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
  extraIds?: number[];
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

  // --- NUEVO: SISTEMA DE PUNTOS ---
  @IsOptional()
  @IsString()
  @IsIn(['FREE_DELIVERY', 'FREE_BEVERAGE', 'FREE_BURGER'])
  rewardType?: string;
}
