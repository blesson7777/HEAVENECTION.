import { SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
export enum Role { ADMIN = 'ADMIN', MANAGER = 'MANAGER', STAFF = 'STAFF' }
export type SessionUser = { id: string; email: string; name: string; role: Role };
export type AuthRequest = Request & { user: SessionUser; sessionToken: string };
export const Public = () => SetMetadata('public', true);
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
