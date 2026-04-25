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
  productId!: number; // Agregamos ! para quitar el error rojo

  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  extraIds?: number[];
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsString()
  deliveryAddress!: string; // Renombrado para consistencia con DB

  @IsString()
  contactPhone!: string; // Renombrado para consistencia con DB

  @IsOptional()
  @IsString()
  @IsIn([
    'QUESO_GRATIS',
    'BEBIDA_GRATIS',
    'PAPAS_GRATIS',
    'DELIVERY_GRATIS',
    'TOCINO_GRATIS',
    'CARNE_EXTRA',
    'DOS_BEBIDAS',
    'UPGRADE_BURGER',
    'DOS_POR_UNO',
    'BURGER_GRATIS',
  ])
  rewardType?: string;
}
