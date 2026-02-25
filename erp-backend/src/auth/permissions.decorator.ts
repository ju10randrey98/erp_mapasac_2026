import { SetMetadata } from '@nestjs/common';

export const PERMS_KEY = 'permissions';
export const Permissions = (...perms: string[]) => SetMetadata(PERMS_KEY, perms);
