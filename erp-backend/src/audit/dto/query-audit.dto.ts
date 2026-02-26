import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryAuditDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit?: number;

  // texto libre: action / actor / target / ip / user_agent
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  actor_id?: string;

  @IsOptional()
  @IsString()
  target_id?: string;

  // ISO string: 2026-02-25 o 2026-02-25T00:00:00.000Z
  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  // orden: newest|oldest
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  order?: 'newest' | 'oldest';
}