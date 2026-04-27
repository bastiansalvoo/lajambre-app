import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';

// Definimos los roles permitidos
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export class RegisterDto {
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  email!: string; // <-- Agrega el !

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string; // <-- Agrega el !

  @IsString()
  name!: string; // <-- Agrega el !

  @IsString()
  phone!: string; // <-- Agrega el !

  @IsOptional()
  @IsString()
  address?: string; // (Este no lo necesita porque tiene el ?)

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
