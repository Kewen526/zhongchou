import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 角色创建规则：哪些角色需要指定上级
  private readonly roleParentRequirements: Record<UserRole, UserRole[] | null> = {
    super_admin: null, // 无需上级
    admin: null, // 无需上级
    product_dev: null, // 无需上级
    sales: ['admin'], // 需要普通管理员作为上级
    supplier: null, // 无需上级
    supplier_sub: ['supplier'], // 需要供应商作为上级
    factory: ['supplier'], // 需要供应商作为上级
    factory_sub: ['factory'], // 需要加工厂作为上级
  };

  // 角色众筹权限限制
  private readonly roleCrowdfundingRestrictions: UserRole[] = [
    'factory',
    'factory_sub',
  ];

  async create(createUserDto: CreateUserDto) {
    const { username, password, role, parentId, modulePermissions } = createUserDto;

    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 验证隶属关系
    await this.validateParentRelation(role, parentId);

    // 验证模块权限（加工厂和加工厂子账号不能有众筹权限）
    this.validateModulePermissions(role, modulePermissions);

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        parentId: parentId ? BigInt(parentId) : null,
        modulePermissions,
      },
      select: {
        id: true,
        username: true,
        role: true,
        parentId: true,
        modulePermissions: true,
        status: true,
        createdAt: true,
      },
    });

    return this.formatUserResponse(user);
  }

  async findAll(queryDto: QueryUserDto) {
    const { username, role, parentId, status, startDate, endDate, page = 1, pageSize = 10 } = queryDto;

    const where: any = {};

    if (username) {
      where.username = { contains: username };
    }

    if (role) {
      where.role = role;
    }

    if (parentId) {
      where.parentId = BigInt(parentId);
    }

    if (status !== undefined) {
      where.status = status;
    }

    // 时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          role: true,
          parentId: true,
          modulePermissions: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          parent: {
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
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => this.formatUserResponse(user)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        username: true,
        role: true,
        parentId: true,
        modulePermissions: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        children: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.formatUserResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updateData: any = {};

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.parentId !== undefined) {
      await this.validateParentRelation(user.role, updateUserDto.parentId);
      updateData.parentId = updateUserDto.parentId ? BigInt(updateUserDto.parentId) : null;
    }

    if (updateUserDto.modulePermissions) {
      this.validateModulePermissions(user.role, updateUserDto.modulePermissions);
      updateData.modulePermissions = updateUserDto.modulePermissions;
    }

    if (updateUserDto.status !== undefined) {
      updateData.status = updateUserDto.status;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        parentId: true,
        modulePermissions: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.formatUserResponse(updatedUser);
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
      include: { children: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否有下级用户
    if (user.children.length > 0) {
      throw new BadRequestException('该用户有下级账号，无法删除');
    }

    await this.prisma.user.delete({
      where: { id: BigInt(id) },
    });

    return { message: '删除成功' };
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { password: hashedPassword },
    });

    return { message: '密码重置成功' };
  }

  // 获取用户的管理链（上级链）
  async getManagementChain(userId: string): Promise<string[]> {
    const chain: string[] = [];
    let currentId: string | null = userId;

    while (currentId) {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(currentId) },
        select: { parentId: true },
      });

      if (user?.parentId) {
        chain.push(user.parentId.toString());
        currentId = user.parentId.toString();
      } else {
        currentId = null;
      }
    }

    // 添加所有超级管理员
    const superAdmins = await this.prisma.user.findMany({
      where: { role: 'super_admin' },
      select: { id: true },
    });

    superAdmins.forEach((admin) => {
      const adminId = admin.id.toString();
      if (!chain.includes(adminId)) {
        chain.push(adminId);
      }
    });

    return chain;
  }

  // 获取下拉选项列表
  async getParentOptions(role: UserRole) {
    const requiredParentRoles = this.roleParentRequirements[role];

    if (!requiredParentRoles) {
      return [];
    }

    const parents = await this.prisma.user.findMany({
      where: {
        role: { in: requiredParentRoles },
        status: 1,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return parents.map((p) => ({
      id: p.id.toString(),
      username: p.username,
      role: p.role,
    }));
  }

  // 验证隶属关系
  private async validateParentRelation(role: UserRole, parentId?: string) {
    const requiredParentRoles = this.roleParentRequirements[role];

    if (requiredParentRoles) {
      if (!parentId) {
        throw new BadRequestException(`${role} 角色必须指定上级用户`);
      }

      const parent = await this.prisma.user.findUnique({
        where: { id: BigInt(parentId) },
      });

      if (!parent) {
        throw new NotFoundException('指定的上级用户不存在');
      }

      if (!requiredParentRoles.includes(parent.role)) {
        throw new BadRequestException(
          `${role} 角色的上级必须是 ${requiredParentRoles.join(' 或 ')}`,
        );
      }
    }
  }

  // 验证模块权限
  private validateModulePermissions(role: UserRole, permissions: string[]) {
    if (this.roleCrowdfundingRestrictions.includes(role)) {
      if (permissions.includes('crowdfunding')) {
        throw new BadRequestException(`${role} 角色不能分配众筹管理权限`);
      }
    }
  }

  // 格式化用户响应
  private formatUserResponse(user: any) {
    return {
      ...user,
      id: user.id.toString(),
      parentId: user.parentId?.toString() || null,
      parent: user.parent
        ? {
            ...user.parent,
            id: user.parent.id.toString(),
          }
        : undefined,
      children: user.children?.map((child: any) => ({
        ...child,
        id: child.id.toString(),
      })),
    };
  }
}
