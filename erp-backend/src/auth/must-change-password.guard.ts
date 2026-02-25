import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const path = req.route?.path ?? '';
    const method = req.method;

    // Permitir endpoints necesarios
    const allow =
      (method === 'POST' && path === '/auth/change-password') ||
      (method === 'GET' && path === '/auth/me');

    if (allow) return true;

    // Si no hay usuario (ruta pública) no bloqueamos aquí
    if (!req.user) return true;

    // Si debe cambiar contraseña, bloquear el resto
    if (req.user.must_change_password) {
      throw new ForbiddenException('Debes cambiar tu contraseña antes de continuar');
    }

    return true;
  }
}
