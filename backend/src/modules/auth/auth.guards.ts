import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthRequest, Role } from './auth.types';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector, @Inject(AuthService) private auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>('public', [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const match = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException();
    request.sessionToken = match[1];
    request.user = await this.auth.authenticate(match[1]);
    return true;
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [context.getHandler(), context.getClass()]);
    if (!roles) return true;
    const user = context.switchToHttp().getRequest<AuthRequest>().user;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}
