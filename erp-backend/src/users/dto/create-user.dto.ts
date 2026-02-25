import { IsArray, IsEmail, IsString, MinLength, ArrayMinSize } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  full_name: string;

  // ✅ Multi-rol obligatorio
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roles: string[];
}