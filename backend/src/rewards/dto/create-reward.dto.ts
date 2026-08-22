import { IsString, IsInt, IsBoolean, IsOptional, Min, Matches } from 'class-validator';

export class CreateRewardDto {
  // Identificador estable, ej: QUESO_GRATIS. Mayusculas y guion bajo.
  @IsString()
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'code debe ser mayusculas, numeros y guion bajo (ej: QUESO_GRATIS)',
  })
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsInt()
  @Min(1)
  pointsCost!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsBoolean()
  freeDelivery?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresBurger?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
