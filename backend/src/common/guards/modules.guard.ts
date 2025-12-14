import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULES_KEY, ModulePermission } from '../decorators/modules.decorator';

@Injectable()
export class ModulesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModules = this.reflector.getAllAndOverride<ModulePermission[]>(MODULES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // 超级管理员拥有所有权限
    if (user.role === 'super_admin') {
      return true;
    }

    const userModules: ModulePermission[] = user.modulePermissions || [];

    // 检查用户是否拥有所需的模块权限
    return requiredModules.some((module) => userModules.includes(module));
  }
}
