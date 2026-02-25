import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
        details: input.details ?? null,
      },
    });
  }
}