import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Debes ingresar un email válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Contraseña demasiado corta' })
  password: string;
}
