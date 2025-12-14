import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PeriodsService } from './periods.service';
import { CreateCrowdfundingDto, InvestDto, AdditionalInvestDto, QueryCrowdfundingDto } from './dto';
import { UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CrowdfundingsService {
  constructor(
    private prisma: PrismaService,
    private periodsService: PeriodsService,
  ) {}

  // 可以发起众筹的角色
  private readonly canCreateRoles: UserRole[] = [
    'super_admin',
    'admin',
    'product_dev',
    'sales',
    'supplier',
  ];

  // 可以参与出资的角色
  private readonly canInvestRoles: UserRole[] = [
    'super_admin',
    'admin',
    'product_dev',
    'sales',
    'supplier',
    'supplier_sub',
  ];

  // 供应商角色（需要竞价）
  private readonly supplierRoles: UserRole[] = ['supplier', 'supplier_sub'];

  async create(createCrowdfundingDto: CreateCrowdfundingDto, userId: string, userRole: UserRole) {
    // 检查发起权限
    if (!this.canCreateRoles.includes(userRole)) {
      throw new ForbiddenException('您的角色无权发起众筹');
    }

    const { productId, ...crowdfundingData } = createCrowdfundingDto;

    // 检查产品是否存在
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(productId) },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 检查产品是否已有进行中的众筹
    if (product.crowdfundingStatus === 'in_progress') {
      throw new ConflictException('该产品已有进行中的众筹');
    }

    // 产品开发只能为自己创建的产品发起众筹
    if (userRole === 'product_dev' && product.creatorId.toString() !== userId) {
      throw new ForbiddenException('产品开发只能为自己创建的产品发起众筹');
    }

    // 获取当前期数
    const currentPeriod = await this.periodsService.getCurrentPeriod();

    // 创建众筹项目
    const crowdfunding = await this.prisma.$transaction(async (tx) => {
      // 创建众筹
      const cf = await tx.crowdfunding.create({
        data: {
          productId: BigInt(productId),
          title: crowdfundingData.title,
          description: crowdfundingData.description,
          targetAmount: crowdfundingData.targetAmount,
          minInvestment: crowdfundingData.minInvestment || 100,
          deadline: crowdfundingData.deadline ? new Date(crowdfundingData.deadline) : null,
          currentPeriodId: BigInt(currentPeriod.id),
          startPeriodId: BigInt(currentPeriod.id),
          creatorId: BigInt(userId),
        },
        include: {
          product: true,
          creator: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });

      // 更新产品众筹状态
      await tx.product.update({
        where: { id: BigInt(productId) },
        data: { crowdfundingStatus: 'in_progress' },
      });

      return cf;
    });

    return this.formatCrowdfundingResponse(crowdfunding);
  }

  async findAll(queryDto: QueryCrowdfundingDto) {
    const { title, status, periodId, creatorId, page = 1, pageSize = 10 } = queryDto;

    const where: any = {};

    if (title) {
      where.title = { contains: title };
    }

    if (status) {
      where.status = status;
    }

    if (periodId) {
      where.currentPeriodId = BigInt(periodId);
    }

    if (creatorId) {
      where.creatorId = BigInt(creatorId);
    }

    const [crowdfundings, total] = await Promise.all([
      this.prisma.crowdfunding.findMany({
        where,
        include: {
          product: {
            include: {
              images: {
                where: { imageType: 'main' },
                take: 1,
              },
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          currentPeriod: true,
          _count: {
            select: { investments: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.crowdfunding.count({ where }),
    ]);

    return {
      items: crowdfundings.map((cf) => this.formatCrowdfundingResponse(cf)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const crowdfunding = await this.prisma.crowdfunding.findUnique({
      where: { id: BigInt(id) },
      include: {
        product: {
          include: {
            images: true,
            creator: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        currentPeriod: true,
        startPeriod: true,
        winnerSupplier: {
          select: {
            id: true,
            username: true,
          },
        },
        investments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
                parentId: true,
              },
            },
            period: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!crowdfunding) {
      throw new NotFoundException('众筹项目不存在');
    }

    // 计算供应商排名
    const supplierRanking = await this.getSupplierRanking(id);

    return {
      ...this.formatCrowdfundingResponse(crowdfunding),
      supplierRanking,
    };
  }

  // 出资
  async invest(investDto: InvestDto, userId: string, userRole: UserRole) {
    // 检查出资权限
    if (!this.canInvestRoles.includes(userRole)) {
      throw new ForbiddenException('您的角色无权参与众筹出资');
    }

    const { crowdfundingId, amount } = investDto;

    const crowdfunding = await this.prisma.crowdfunding.findUnique({
      where: { id: BigInt(crowdfundingId) },
    });

    if (!crowdfunding) {
      throw new NotFoundException('众筹项目不存在');
    }

    if (crowdfunding.status !== 'in_progress') {
      throw new BadRequestException('众筹项目不在进行中');
    }

    if (amount < Number(crowdfunding.minInvestment)) {
      throw new BadRequestException(`出资金额不能低于${crowdfunding.minInvestment}元`);
    }

    // 检查是否已经出资过
    const existingInvestment = await this.prisma.investment.findFirst({
      where: {
        crowdfundingId: BigInt(crowdfundingId),
        userId: BigInt(userId),
        investmentType: 'initial',
      },
    });

    if (existingInvestment) {
      throw new ConflictException('您已经出资过，请使用追加出资功能');
    }

    // 如果是供应商，需要检查竞价约束
    if (this.supplierRoles.includes(userRole)) {
      await this.validateSupplierInvestment(crowdfundingId, userId, amount);
    }

    // 获取当前期数
    const currentPeriod = await this.periodsService.getCurrentPeriod();

    // 创建出资记录
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建出资记录
      const investment = await tx.investment.create({
        data: {
          crowdfundingId: BigInt(crowdfundingId),
          userId: BigInt(userId),
          amount,
          investmentType: 'initial',
          periodId: BigInt(currentPeriod.id),
        },
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

      // 更新众筹当前金额
      const newAmount = Number(crowdfunding.currentAmount) + amount;
      const updateData: any = {
        currentAmount: newAmount,
      };

      // 检查是否达到目标金额
      if (newAmount >= Number(crowdfunding.targetAmount)) {
        updateData.status = 'success';
        updateData.successAt = new Date();

        // 自动确定中标供应商（最高出资供应商）
        const winnerSupplier = await this.getWinnerSupplier(crowdfundingId);
        if (winnerSupplier) {
          updateData.winnerSupplierId = BigInt(winnerSupplier.supplierId);
        }

        // 更新产品状态
        await tx.product.update({
          where: { id: crowdfunding.productId },
          data: { crowdfundingStatus: 'success' },
        });
      }

      await tx.crowdfunding.update({
        where: { id: BigInt(crowdfundingId) },
        data: updateData,
      });

      return investment;
    });

    return this.formatInvestmentResponse(result);
  }

  // 追加出资
  async additionalInvest(
    crowdfundingId: string,
    additionalInvestDto: AdditionalInvestDto,
    userId: string,
    userRole: UserRole,
  ) {
    const { amount } = additionalInvestDto;

    if (amount < 100) {
      throw new BadRequestException('追加金额不能低于100元');
    }

    const crowdfunding = await this.prisma.crowdfunding.findUnique({
      where: { id: BigInt(crowdfundingId) },
    });

    if (!crowdfunding) {
      throw new NotFoundException('众筹项目不存在');
    }

    if (crowdfunding.status !== 'in_progress') {
      throw new BadRequestException('众筹项目不在进行中');
    }

    // 检查是否已经首次出资
    const existingInvestment = await this.prisma.investment.findFirst({
      where: {
        crowdfundingId: BigInt(crowdfundingId),
        userId: BigInt(userId),
        investmentType: 'initial',
      },
    });

    if (!existingInvestment) {
      throw new BadRequestException('请先进行首次出资');
    }

    // 如果是供应商，需要检查竞价约束
    if (this.supplierRoles.includes(userRole)) {
      await this.validateSupplierInvestment(crowdfundingId, userId, amount, true);
    }

    // 获取当前期数
    const currentPeriod = await this.periodsService.getCurrentPeriod();

    // 创建追加出资记录
    const result = await this.prisma.$transaction(async (tx) => {
      const investment = await tx.investment.create({
        data: {
          crowdfundingId: BigInt(crowdfundingId),
          userId: BigInt(userId),
          amount,
          investmentType: 'additional',
          periodId: BigInt(currentPeriod.id),
        },
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

      // 更新众筹当前金额
      const newAmount = Number(crowdfunding.currentAmount) + amount;
      const updateData: any = {
        currentAmount: newAmount,
      };

      // 检查是否达到目标金额
      if (newAmount >= Number(crowdfunding.targetAmount)) {
        updateData.status = 'success';
        updateData.successAt = new Date();

        const winnerSupplier = await this.getWinnerSupplier(crowdfundingId);
        if (winnerSupplier) {
          updateData.winnerSupplierId = BigInt(winnerSupplier.supplierId);
        }

        await tx.product.update({
          where: { id: crowdfunding.productId },
          data: { crowdfundingStatus: 'success' },
        });
      }

      await tx.crowdfunding.update({
        where: { id: BigInt(crowdfundingId) },
        data: updateData,
      });

      return investment;
    });

    return this.formatInvestmentResponse(result);
  }

  // 取消众筹
  async cancel(id: string, userId: string, userRole: UserRole) {
    const crowdfunding = await this.prisma.crowdfunding.findUnique({
      where: { id: BigInt(id) },
    });

    if (!crowdfunding) {
      throw new NotFoundException('众筹项目不存在');
    }

    if (crowdfunding.status !== 'in_progress') {
      throw new BadRequestException('只能取消进行中的众筹');
    }

    // 检查取消权限：发起人或管理员
    const canCancel =
      crowdfunding.creatorId.toString() === userId ||
      userRole === 'super_admin' ||
      userRole === 'admin';

    if (!canCancel) {
      throw new ForbiddenException('无权取消此众筹');
    }

    await this.prisma.$transaction(async (tx) => {
      // 更新众筹状态
      await tx.crowdfunding.update({
        where: { id: BigInt(id) },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: BigInt(userId),
        },
      });

      // 更新产品状态
      await tx.product.update({
        where: { id: crowdfunding.productId },
        data: { crowdfundingStatus: 'cancelled' },
      });

      // 退还资金（记录退款，实际是虚拟数字不需要处理）
    });

    return { message: '众筹已取消，资金已归还出资人' };
  }

  // 标记失败
  async markAsFailed(id: string, userId: string, userRole: UserRole) {
    const crowdfunding = await this.prisma.crowdfunding.findUnique({
      where: { id: BigInt(id) },
    });

    if (!crowdfunding) {
      throw new NotFoundException('众筹项目不存在');
    }

    if (crowdfunding.status !== 'in_progress') {
      throw new BadRequestException('只能标记进行中的众筹为失败');
    }

    // 检查权限：发起人或管理员
    const canMark =
      crowdfunding.creatorId.toString() === userId ||
      userRole === 'super_admin' ||
      userRole === 'admin';

    if (!canMark) {
      throw new ForbiddenException('无权标记此众筹为失败');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.crowdfunding.update({
        where: { id: BigInt(id) },
        data: {
          status: 'failed',
          failedAt: new Date(),
          failedBy: BigInt(userId),
        },
      });

      await tx.product.update({
        where: { id: crowdfunding.productId },
        data: { crowdfundingStatus: 'failed' },
      });
    });

    return { message: '众筹已标记为失败，资金已归还出资人' };
  }

  // 获取供应商出资排名
  async getSupplierRanking(crowdfundingId: string) {
    // 获取所有供应商及其子账号的出资
    const investments = await this.prisma.investment.findMany({
      where: {
        crowdfundingId: BigInt(crowdfundingId),
        user: {
          role: { in: ['supplier', 'supplier_sub'] },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            parentId: true,
          },
        },
      },
    });

    // 按供应商分组计算总额
    const supplierTotals = new Map<string, { supplierId: string; supplierName: string; totalAmount: number }>();

    for (const inv of investments) {
      // 确定供应商ID（如果是子账号，使用其父级供应商ID）
      const supplierId =
        inv.user.role === 'supplier_sub' && inv.user.parentId
          ? inv.user.parentId.toString()
          : inv.user.id.toString();

      const existing = supplierTotals.get(supplierId);
      if (existing) {
        existing.totalAmount += Number(inv.amount);
      } else {
        // 获取供应商名称
        let supplierName = inv.user.username;
        if (inv.user.role === 'supplier_sub' && inv.user.parentId) {
          const supplier = await this.prisma.user.findUnique({
            where: { id: inv.user.parentId },
            select: { username: true },
          });
          supplierName = supplier?.username || supplierName;
        }

        supplierTotals.set(supplierId, {
          supplierId,
          supplierName,
          totalAmount: Number(inv.amount),
        });
      }
    }

    // 转换为数组并排序
    const ranking = Array.from(supplierTotals.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    return ranking;
  }

  // 验证供应商出资（确保总额不重复）
  private async validateSupplierInvestment(
    crowdfundingId: string,
    userId: string,
    amount: number,
    isAdditional: boolean = false,
  ) {
    // 获取用户信息，确定供应商ID
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const supplierId = user.role === 'supplier_sub' && user.parentId
      ? user.parentId.toString()
      : userId;

    // 获取该供应商组当前的出资总额
    const supplierUserIds = await this.getSupplierGroupUserIds(supplierId);

    const currentTotal = await this.prisma.investment.aggregate({
      where: {
        crowdfundingId: BigInt(crowdfundingId),
        userId: { in: supplierUserIds.map((id) => BigInt(id)) },
      },
      _sum: { amount: true },
    });

    const newTotal = Number(currentTotal._sum.amount || 0) + amount;

    // 获取其他供应商的出资总额
    const ranking = await this.getSupplierRanking(crowdfundingId);

    // 检查是否有重复金额
    const otherSupplierTotals = ranking
      .filter((r) => r.supplierId !== supplierId)
      .map((r) => r.totalAmount);

    if (otherSupplierTotals.includes(newTotal)) {
      throw new ConflictException(
        `出资后总额为${newTotal}元，与其他供应商相同，请调整出资金额`,
      );
    }
  }

  // 获取供应商组的所有用户ID
  private async getSupplierGroupUserIds(supplierId: string): Promise<string[]> {
    const userIds = [supplierId];

    // 获取子账号
    const subAccounts = await this.prisma.user.findMany({
      where: {
        parentId: BigInt(supplierId),
        role: 'supplier_sub',
      },
      select: { id: true },
    });

    subAccounts.forEach((sub) => userIds.push(sub.id.toString()));

    return userIds;
  }

  // 获取中标供应商
  private async getWinnerSupplier(crowdfundingId: string) {
    const ranking = await this.getSupplierRanking(crowdfundingId);
    return ranking.length > 0 ? ranking[0] : null;
  }

  // 格式化众筹响应
  private formatCrowdfundingResponse(crowdfunding: any) {
    return {
      ...crowdfunding,
      id: crowdfunding.id.toString(),
      productId: crowdfunding.productId.toString(),
      creatorId: crowdfunding.creatorId.toString(),
      currentPeriodId: crowdfunding.currentPeriodId?.toString() || null,
      startPeriodId: crowdfunding.startPeriodId?.toString() || null,
      winnerSupplierId: crowdfunding.winnerSupplierId?.toString() || null,
      cancelledBy: crowdfunding.cancelledBy?.toString() || null,
      failedBy: crowdfunding.failedBy?.toString() || null,
      targetAmount: Number(crowdfunding.targetAmount),
      currentAmount: Number(crowdfunding.currentAmount),
      minInvestment: Number(crowdfunding.minInvestment),
      product: crowdfunding.product
        ? {
            ...crowdfunding.product,
            id: crowdfunding.product.id.toString(),
            creatorId: crowdfunding.product.creatorId.toString(),
            factoryId: crowdfunding.product.factoryId?.toString() || null,
          }
        : undefined,
      creator: crowdfunding.creator
        ? {
            ...crowdfunding.creator,
            id: crowdfunding.creator.id.toString(),
          }
        : undefined,
      currentPeriod: crowdfunding.currentPeriod
        ? {
            ...crowdfunding.currentPeriod,
            id: crowdfunding.currentPeriod.id.toString(),
          }
        : undefined,
      investments: crowdfunding.investments?.map((inv: any) => this.formatInvestmentResponse(inv)),
      investorCount: crowdfunding._count?.investments,
    };
  }

  // 格式化出资记录响应
  private formatInvestmentResponse(investment: any) {
    return {
      ...investment,
      id: investment.id.toString(),
      crowdfundingId: investment.crowdfundingId.toString(),
      userId: investment.userId.toString(),
      periodId: investment.periodId.toString(),
      amount: Number(investment.amount),
      user: investment.user
        ? {
            ...investment.user,
            id: investment.user.id.toString(),
            parentId: investment.user.parentId?.toString() || null,
          }
        : undefined,
    };
  }
}
