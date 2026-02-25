import { IsBoolean, IsOptional } from 'class-validator';

export class ResetPasswordDto {
  // si true => el usuario deberá cambiar su contraseña al iniciar sesión
  @IsOptional()
  @IsBoolean()
  must_change_password?: boolean = true;
}