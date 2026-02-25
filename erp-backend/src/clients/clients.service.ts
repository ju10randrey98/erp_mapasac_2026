import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.clients.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.clients.findUnique({ where: { id } });
  }

  async create(dto: CreateClientDto) {
	  
	   if (!dto) {
    throw new BadRequestException('Body vacío: envía JSON con Content-Type: application/json');
  }
  if (!dto.name) {
    throw new BadRequestException('Falta name');
  }
  if (!dto.code) {
    throw new BadRequestException('Falta code');
  }
    try {
      return await this.prisma.clients.create({
        data: {
			code: dto.code,
			name: dto.name,
			doc_type: dto.doc_type ?? null,
			doc_number: dto.doc_number ?? null,
			email: dto.email ?? null,
			phone: dto.phone ?? null,
			address: dto.address ?? null,
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Cliente duplicado (code o documento)');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateClientDto) {
    try {
      return await this.prisma.clients.update({
        where: { id },
        data: {
          ...dto,
          updated_at: new Date(),
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Cliente duplicado (code o documento)');
      }
      throw e;
    }
  }

  remove(id: string) {
    // ERP-friendly: soft delete recomendado, pero por ahora delete directo
    return this.prisma.clients.delete({ where: { id } });
  }
}
