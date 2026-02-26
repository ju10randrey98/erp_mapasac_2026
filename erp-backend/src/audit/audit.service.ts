import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { QueryAuditDto } from './dto/query-audit.dto';

type AuditLogInput = {
  action: string;
  actorId?: string | null;
  targetId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  details?: any;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    return this.prisma.audit_logs.create({
      data: {
        action: input.action,
        actor_id: input.actorId ?? null,
        target_id: input.targetId ?? null,
        ip: input.ip ?? null,
        user_agent: input.userAgent ?? null,
        details: input.details ?? undefined,
      },
    });
  }

  async findAllPaginated(query: QueryAuditDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.audit_logsWhereInput = {};

    if (query.action?.trim()) {
      where.action = { contains: query.action.trim(), mode: 'insensitive' };
    }

    if (query.actor_id?.trim()) where.actor_id = query.actor_id.trim();
    if (query.target_id?.trim()) where.target_id = query.target_id.trim();

    if (query.date_from || query.date_to) {
      where.created_at = {};
      if (query.date_from) (where.created_at as any).gte = new Date(query.date_from);
      if (query.date_to) (where.created_at as any).lte = new Date(query.date_to);
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { ip: { contains: q, mode: 'insensitive' } },
        { user_agent: { contains: q, mode: 'insensitive' } },
        { actor: { is: { username: { contains: q, mode: 'insensitive' } } } },
        { actor: { is: { email: { contains: q, mode: 'insensitive' } } } },
        { target: { is: { username: { contains: q, mode: 'insensitive' } } } },
        { target: { is: { email: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const orderBy =
      query.order === 'oldest'
        ? ({ created_at: 'asc' } as const)
        : ({ created_at: 'desc' } as const);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.audit_logs.count({ where }),
      this.prisma.audit_logs.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          actor_id: true,
          target_id: true,
          ip: true,
          user_agent: true,
          details: true,
          created_at: true,
          actor: { select: { id: true, username: true, email: true } },
          target: { select: { id: true, username: true, email: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, meta: { page, limit, total, totalPages } };
  }
}