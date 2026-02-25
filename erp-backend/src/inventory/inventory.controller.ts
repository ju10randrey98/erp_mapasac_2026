import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Permissions } from '../auth/permissions.decorator';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Permissions('inventory.read')
  @Get()
  stock(@Query('warehouse_id') warehouse_id?: string) {
    return this.service.stock(warehouse_id);
  }

  @Permissions('inventory.adjust')
  @Post('adjust')
  adjust(@Body() dto: AdjustInventoryDto) {
    return this.service.adjust(dto);
  }
}
