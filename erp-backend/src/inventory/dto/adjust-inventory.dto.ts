import { IsNumber, IsString, IsUUID } from 'class-validator';

export class AdjustInventoryDto {
  @IsUUID()
  product_id: string;

  @IsUUID()
  warehouse_id: string;

  @IsNumber()
  qty_delta: number; // +10 entrada, -2 salida/ajuste

  @IsString()
  reason: string; // "Ajuste inicial", "Corrección", etc.
}
