import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  address?: string;

  // NOTA: El rol NO se acepta por el DTO de registro.
  // Los admins se crean directamente en la base de datos.
}
