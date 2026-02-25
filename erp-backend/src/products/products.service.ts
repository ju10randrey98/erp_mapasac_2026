import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.products.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.products.create({
        data: {
          sku: dto.sku,
          name: dto.name,
          description: dto.description ?? null,
          unit: dto.unit ?? 'UND',
          price: dto.price ?? null,
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('SKU duplicado');
      }
      throw e;
    }
  }
}
