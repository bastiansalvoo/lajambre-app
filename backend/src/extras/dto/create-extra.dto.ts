// src/extras/dto/create-extra.dto.ts
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateExtraDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
