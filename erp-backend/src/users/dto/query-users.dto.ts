import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryUsersDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  // búsqueda por username/email/full_name
  @IsOptional()
  @IsString()
  q?: string;

  // filtro activo
  @IsOptional()
  @IsIn(['true', 'false'])
  is_active?: 'true' | 'false';
}