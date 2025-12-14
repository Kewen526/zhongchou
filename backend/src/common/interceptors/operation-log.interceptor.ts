import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

export const OPERATION_LOG_KEY = 'operation_log';

export interface OperationLogMetadata {
  module: string;
  action: string;
  getTargetId?: (req: any, result: any) => bigint | undefined;
  getTargetType?: () => string;
  getBeforeData?: (req: any) => any;
}

export function OperationLog(metadata: OperationLogMetadata) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(OPERATION_LOG_KEY, metadata, descriptor.value);
    return descriptor;
  };
}

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = Reflect.getMetadata(OPERATION_LOG_KEY, context.getHandler());

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const beforeData = metadata.getBeforeData ? metadata.getBeforeData(request) : null;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.prisma.operationLog.create({
            data: {
              userId: user ? BigInt(user.id) : null,
              username: user?.username || null,
              module: metadata.module,
              action: metadata.action,
              targetType: metadata.getTargetType ? metadata.getTargetType() : null,
              targetId: metadata.getTargetId ? metadata.getTargetId(request, result) : null,
              beforeData: beforeData,
              afterData: result ? JSON.parse(JSON.stringify(result, (_, v) =>
                typeof v === 'bigint' ? v.toString() : v
              )) : null,
              ipAddress: request.ip || request.connection?.remoteAddress,
              userAgent: request.headers['user-agent'] || null,
            },
          });
        } catch (error) {
          console.error('Failed to create operation log:', error);
        }
      }),
    );
  }
}
