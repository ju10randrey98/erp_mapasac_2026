import { IsEmail, IsOptional, IsString, MinLength, IsArray } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  // Si envías roles, REEMPLAZA la lista actual (sync)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}