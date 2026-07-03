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
  productId!: number;

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
  deliveryAddress!: string;

  @IsString()
  contactPhone!: string;

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
