import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLogDto } from './dto';

export interface CreateLogParams {
  userId?: string;
  username?: string;
  module: string;
  action: string;
  targetType?: string;
  targetId?: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async create(params: CreateLogParams) {
    const log = await this.prisma.operationLog.create({
      data: {
        userId: params.userId ? BigInt(params.userId) : null,
        username: params.username || null,
        module: params.module,
        action: params.action,
        targetType: params.targetType || null,
        targetId: params.targetId ? BigInt(params.targetId) : null,
        beforeData: params.beforeData || null,
        afterData: params.afterData || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });

    return this.formatLogResponse(log);
  }

  async findAll(queryDto: QueryLogDto) {
    const {
      userId,
      module,
      action,
      targetType,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = queryDto;

    const where: any = {};

    if (userId) {
      where.userId = BigInt(userId);
    }

    if (module) {
      where.module = module;
    }

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      items: logs.map((log) => this.formatLogResponse(log)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.operationLog.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return log ? this.formatLogResponse(log) : null;
  }

  // 获取模块列表
  async getModules() {
    const modules = await this.prisma.operationLog.findMany({
      select: { module: true },
      distinct: ['module'],
    });

    return modules.map((m) => m.module);
  }

  // 获取操作类型列表
  async getActions() {
    const actions = await this.prisma.operationLog.findMany({
      select: { action: true },
      distinct: ['action'],
    });

    return actions.map((a) => a.action);
  }

  private formatLogResponse(log: any) {
    return {
      ...log,
      id: log.id.toString(),
      userId: log.userId?.toString() || null,
      targetId: log.targetId?.toString() || null,
      user: log.user
        ? {
            ...log.user,
            id: log.user.id.toString(),
          }
        : undefined,
    };
  }
}
