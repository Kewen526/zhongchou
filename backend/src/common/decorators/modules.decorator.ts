import { SetMetadata } from '@nestjs/common';

export const MODULES_KEY = 'modules';
export type ModulePermission = 'product' | 'crowdfunding' | 'fund';
export const RequireModules = (...modules: ModulePermission[]) => SetMetadata(MODULES_KEY, modules);
