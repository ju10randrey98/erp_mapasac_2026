import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { username },
      include: {
        user_roles: {
          include: { roles: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    if (user.is_active === false)
      throw new ForbiddenException('Usuario inactivo');

    if (user.locked_until && user.locked_until > new Date()) {
      throw new ForbiddenException('Usuario bloqueado temporalmente');
    }

    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      const failed = (user.failed_attempts ?? 0) + 1;
      const lock = failed >= 3 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.prisma.users.update({
        where: { id: user.id },
        data: { failed_attempts: failed, locked_until: lock },
      });

      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        failed_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
      },
    });

    const roles = user.user_roles.map((ur) => ur.roles.name);
    const roleIds = user.user_roles.map((ur) => ur.role_id);

    const rolePerms = await this.prisma.role_permissions.findMany({
      where: { role_id: { in: roleIds } },
      include: { permissions: true },
    });

    const permissions = Array.from(
      new Set(rolePerms.map((rp) => rp.permissions.code)),
    );

    const payload = {
      sub: user.id,
      username: user.username,
      roles,
      permissions,
      must_change_password: user.must_change_password,
    };

    const access_token = await this.jwt.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles,
        permissions,
        must_change_password: user.must_change_password,
      },
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles: { include: { roles: true } },
      },
    });

    if (!user) throw new UnauthorizedException();

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok)
      throw new BadRequestException('Contraseña actual incorrecta');

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: newHash,
        must_change_password: false,
        failed_attempts: 0,
        locked_until: null,
      },
    });

    const roles = user.user_roles.map((ur) => ur.roles.name);
    const roleIds = user.user_roles.map((ur) => ur.role_id);

    const rolePerms = await this.prisma.role_permissions.findMany({
      where: { role_id: { in: roleIds } },
      include: { permissions: true },
    });

    const permissions = Array.from(
      new Set(rolePerms.map((rp) => rp.permissions.code)),
    );

    const payload = {
      sub: user.id,
      username: user.username,
      roles,
      permissions,
      must_change_password: false,
    };

    const access_token = await this.jwt.signAsync(payload);

    return {
      message: 'Contraseña actualizada correctamente',
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles,
        permissions,
        must_change_password: false,
      },
    };
  }
}