import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  STORE_OWNER = 'store_owner',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);