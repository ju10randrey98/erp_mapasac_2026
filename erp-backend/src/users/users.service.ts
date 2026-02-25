import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAllPaginated(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.usersWhereInput = {};

    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { full_name: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.is_active === 'true') where.is_active = true;
    if (query.is_active === 'false') where.is_active = false;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          full_name: true,
          is_active: true,
          must_change_password: true,
          last_login_at: true,
          failed_attempts: true,
          locked_until: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, meta: { page, limit, total, totalPages } };
  }

  async findByUsername(username: string) {
    return this.prisma.users.findUnique({ where: { username } });
  }

  async setActive(id: string, is_active: boolean, actorId?: string, ip?: string, userAgent?: string) {
    const updated = await this.prisma.users.update({
      where: { id },
      data: { is_active },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        is_active: true,
        must_change_password: true,
        failed_attempts: true,
        locked_until: true,
        updated_at: true,
      },
    });

    if (actorId) {
      await this.audit.log({
        action: 'users.set_active',
        actorId,
        targetId: id,
        ip,
        userAgent,
        details: { is_active },
      });
    }

    return updated;
  }

  async unlockUser(id: string, actorId?: string, ip?: string, userAgent?: string) {
    const updated = await this.prisma.users.update({
      where: { id },
      data: { failed_attempts: 0, locked_until: null },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        is_active: true,
        must_change_password: true,
        failed_attempts: true,
        locked_until: true,
        updated_at: true,
      },
    });

    if (actorId) {
      await this.audit.log({
        action: 'users.unlock',
        actorId,
        targetId: id,
        ip,
        userAgent,
        details: { username: updated.username },
      });
    }

    return updated;
  }

  private generateTempPassword() {
    return `Tmp-${randomBytes(6).toString('hex')}`;
  }

  async createUser(dto: CreateUserDto, actorId?: string, ip?: string, userAgent?: string) {
    const username = dto.username.trim().toLowerCase();
    const email = dto.email.trim().toLowerCase();
    const full_name = dto.full_name?.trim() || null;

    const roles = (dto.roles ?? []).map((r) => r.trim()).filter(Boolean);
    if (roles.length < 1) {
      throw new BadRequestException('Debe asignar al menos 1 rol');
    }

    const tempPassword = this.generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const foundRoles = await tx.roles.findMany({
          where: { name: { in: roles } },
          select: { id: true, name: true },
        });

        if (foundRoles.length !== roles.length) {
          const set = new Set(foundRoles.map((r) => r.name));
          const missing = roles.filter((r) => !set.has(r));
          throw new BadRequestException(`Roles no existen: ${missing.join(', ')}`);
        }

        const user = await tx.users.create({
          data: {
            username,
            email,
            full_name,
            password_hash,
            must_change_password: true,
            is_active: true,
            failed_attempts: 0,
          },
          select: {
            id: true,
            username: true,
            email: true,
            full_name: true,
            must_change_password: true,
            is_active: true,
            created_at: true,
          },
        });

        await tx.user_roles.createMany({
          data: foundRoles.map((r) => ({ user_id: user.id, role_id: r.id })),
          skipDuplicates: true,
        });

        return { user, roleNames: foundRoles.map((r) => r.name) };
      });

      if (actorId) {
        await this.audit.log({
          action: 'users.create',
          actorId,
          targetId: result.user.id,
          ip,
          userAgent,
          details: {
            username: result.user.username,
            email: result.user.email,
            roles: result.roleNames,
          },
        });
      }

      return { user: result.user, roles: result.roleNames, tempPassword };
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = (e.meta as any)?.target as string[] | undefined;

        if (target?.includes('username')) throw new ConflictException('El username ya existe');
        if (target?.includes('email')) throw new ConflictException('El email ya existe');

        throw new ConflictException('Username o email ya existe');
      }
      throw e;
    }
  }

  async resetPassword(
    id: string,
    mustChangePassword = true,
    actorId?: string,
    ip?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: { id: true, username: true },
    });
    if (!user) throw new BadRequestException('Usuario no existe');

    const tempPassword = this.generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);

    const updated = await this.prisma.users.update({
      where: { id },
      data: {
        password_hash,
        must_change_password: mustChangePassword,
        failed_attempts: 0,
        locked_until: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        is_active: true,
        must_change_password: true,
        failed_attempts: true,
        locked_until: true,
        updated_at: true,
      },
    });

    if (actorId) {
      await this.audit.log({
        action: 'users.reset_password',
        actorId,
        targetId: id,
        ip,
        userAgent,
        details: { username: user.username, mustChangePassword },
      });
    }

    return { user: updated, tempPassword };
  }
}