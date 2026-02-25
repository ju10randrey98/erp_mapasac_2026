import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async stock(warehouse_id?: string) {
    return this.prisma.inventory_stock.findMany({
      where: warehouse_id ? { warehouse_id } : undefined,
      include: {
        products: true,
        warehouses: true,
      },
    });
  }

  async adjust(dto: AdjustInventoryDto) {
    if (!dto.reason) {
      throw new BadRequestException('reason es obligatorio');
    }

    return this.prisma.inventory_stock.upsert({
      where: {
        product_id_warehouse_id: {
          product_id: dto.product_id,
          warehouse_id: dto.warehouse_id,
        },
      },
      create: {
        product_id: dto.product_id,
        warehouse_id: dto.warehouse_id,
        qty: dto.qty_delta,
      },
      update: {
        qty: { increment: dto.qty_delta },
      },
    });
  }
}

