import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PeriodsService } from '../crowdfundings/periods.service';
import { CreateFundApplicationDto, ApproveDto, QueryFundApplicationDto, QueryFundOverviewDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class FundsService {
  constructor(
    private prisma: PrismaService,
    private periodsService: PeriodsService,
  ) {}

  // 审批链定义
  private readonly approvalChain: Record<UserRole, UserRole | null> = {
    factory_sub: 'factory',
    factory: 'supplier',
    supplier_sub: 'supplier',
    supplier: 'admin',
    sales: 'admin',
    product_dev: 'admin',
    admin: 'super_admin',
    super_admin: null, // 超级管理员无需审批
  };

  // 获取资金总览
  async getOverview(queryDto: QueryFundOverviewDto) {
    let periodId = queryDto.periodId;

    if (!periodId) {
      const currentPeriod = await this.periodsService.getCurrentPeriod();
      periodId = currentPeriod.id;
    }

    // 获取该期数的所有众筹成功金额
    const successfulCrowdfundings = await this.prisma.crowdfunding.findMany({
      where: {
        status: 'success',
        currentPeriodId: BigInt(periodId),
      },
      select: {
        currentAmount: true,
      },
    });

    const totalAmount = successfulCrowdfundings.reduce(
      (sum, cf) => sum + Number(cf.currentAmount),
      0,
    );

    // 获取已使用金额（已通过的申请）
    const approvedApplications = await this.prisma.fundApplication.findMany({
      where: {
        periodId: BigInt(periodId),
        status: 'approved',
      },
      select: {
        amount: true,
      },
    });

    const usedAmount = approvedApplications.reduce(
      (sum, app) => sum + Number(app.amount),
      0,
    );

    const remainingAmount = totalAmount - usedAmount;
    const usageRate = totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0;

    // 获取期数信息
    const period = await this.periodsService.findOne(periodId);

    return {
      period,
      totalAmount,
      usedAmount,
      remainingAmount,
      usageRate: Math.round(usageRate * 100) / 100,
    };
  }

  // 创建资金使用申请
  async createApplication(
    createDto: CreateFundApplicationDto,
    userId: string,
    userRole: UserRole,
  ) {
    const { crowdfundingId, amount, reason } = createDto;

    // 检查众筹项目是否存在
    const crowdfunding = await this.prisma.crowdfunding.findUnique({
      where: { id: BigInt(crowdfundingId) },
    });

    if (!crowdfunding) {
      throw new NotFoundException('众筹项目不存在');
    }

    // 检查用户是否有该众筹的出资记录
    const hasInvestment = await this.prisma.investment.findFirst({
      where: {
        crowdfundingId: BigInt(crowdfundingId),
        userId: BigInt(userId),
      },
    });

    if (!hasInvestment) {
      throw new ForbiddenException('您未参与该众筹项目，无权申请使用资金');
    }

    // 获取当前期数
    const currentPeriod = await this.periodsService.getCurrentPeriod();

    // 确定第一个审批人
    const nextApproverRole = this.approvalChain[userRole];
    let currentApproverId: bigint | null = null;

    if (nextApproverRole) {
      // 获取用户的上级作为审批人
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: { parentId: true },
      });

      if (user?.parentId) {
        currentApproverId = user.parentId;
      } else {
        // 如果没有直接上级，找该角色的用户
        const approver = await this.prisma.user.findFirst({
          where: { role: nextApproverRole, status: 1 },
          select: { id: true },
        });
        currentApproverId = approver?.id || null;
      }
    }

    const application = await this.prisma.fundApplication.create({
      data: {
        applicantId: BigInt(userId),
        crowdfundingId: BigInt(crowdfundingId),
        periodId: BigInt(currentPeriod.id),
        amount,
        reason,
        currentApproverId,
      },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        crowdfunding: {
          select: {
            id: true,
            title: true,
          },
        },
        period: true,
        currentApprover: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return this.formatApplicationResponse(application);
  }

  // 获取申请列表
  async findAllApplications(queryDto: QueryFundApplicationDto, userId: string, userRole: UserRole) {
    const { periodId, status, applicantId, page = 1, pageSize = 10 } = queryDto;

    const where: any = {};

    if (periodId) {
      where.periodId = BigInt(periodId);
    }

    if (status) {
      where.status = status;
    }

    if (applicantId) {
      where.applicantId = BigInt(applicantId);
    }

    // 非超级管理员只能看到自己申请的或需要自己审批的
    if (userRole !== 'super_admin') {
      where.OR = [
        { applicantId: BigInt(userId) },
        { currentApproverId: BigInt(userId) },
      ];
    }

    const [applications, total] = await Promise.all([
      this.prisma.fundApplication.findMany({
        where,
        include: {
          applicant: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          crowdfunding: {
            select: {
              id: true,
              title: true,
            },
          },
          period: true,
          currentApprover: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  username: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fundApplication.count({ where }),
    ]);

    return {
      items: applications.map((app) => this.formatApplicationResponse(app)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取待审批列表
  async getPendingApprovals(userId: string) {
    const applications = await this.prisma.fundApplication.findMany({
      where: {
        currentApproverId: BigInt(userId),
        status: 'pending',
      },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        crowdfunding: {
          select: {
            id: true,
            title: true,
          },
        },
        period: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return applications.map((app) => this.formatApplicationResponse(app));
  }

  // 审批
  async approve(applicationId: string, approveDto: ApproveDto, userId: string, userRole: UserRole) {
    const { action, comment } = approveDto;

    const application = await this.prisma.fundApplication.findUnique({
      where: { id: BigInt(applicationId) },
      include: {
        applicant: true,
      },
    });

    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    if (application.status !== 'pending') {
      throw new BadRequestException('该申请已处理');
    }

    // 检查是否是当前审批人
    if (application.currentApproverId?.toString() !== userId && userRole !== 'super_admin') {
      throw new ForbiddenException('您不是当前审批人');
    }

    await this.prisma.$transaction(async (tx) => {
      // 创建审批记录
      await tx.approval.create({
        data: {
          applicationId: BigInt(applicationId),
          approverId: BigInt(userId),
          action,
          comment,
        },
      });

      if (action === 'reject') {
        // 拒绝，直接结束
        await tx.fundApplication.update({
          where: { id: BigInt(applicationId) },
          data: {
            status: 'rejected',
            currentApproverId: null,
          },
        });
      } else {
        // 通过，确定下一个审批人
        const approverRole = await this.prisma.user.findUnique({
          where: { id: BigInt(userId) },
          select: { role: true },
        });

        const nextApproverRole = approverRole ? this.approvalChain[approverRole.role] : null;

        if (!nextApproverRole) {
          // 审批链结束，申请通过
          await tx.fundApplication.update({
            where: { id: BigInt(applicationId) },
            data: {
              status: 'approved',
              currentApproverId: null,
            },
          });
        } else {
          // 找到下一个审批人
          let nextApproverId: bigint | null = null;

          // 首先尝试找当前审批人的上级
          const currentApprover = await tx.user.findUnique({
            where: { id: BigInt(userId) },
            select: { parentId: true },
          });

          if (currentApprover?.parentId) {
            nextApproverId = currentApprover.parentId;
          } else {
            // 找该角色的任意用户
            const nextApprover = await tx.user.findFirst({
              where: { role: nextApproverRole, status: 1 },
              select: { id: true },
            });
            nextApproverId = nextApprover?.id || null;
          }

          if (!nextApproverId) {
            // 没有下一级审批人，申请通过
            await tx.fundApplication.update({
              where: { id: BigInt(applicationId) },
              data: {
                status: 'approved',
                currentApproverId: null,
              },
            });
          } else {
            await tx.fundApplication.update({
              where: { id: BigInt(applicationId) },
              data: {
                currentApproverId: nextApproverId,
              },
            });
          }
        }
      }
    });

    // 返回更新后的申请
    const updatedApplication = await this.prisma.fundApplication.findUnique({
      where: { id: BigInt(applicationId) },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        crowdfunding: {
          select: {
            id: true,
            title: true,
          },
        },
        period: true,
        currentApprover: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.formatApplicationResponse(updatedApplication);
  }

  // 撤销申请
  async cancelApplication(applicationId: string, userId: string) {
    const application = await this.prisma.fundApplication.findUnique({
      where: { id: BigInt(applicationId) },
    });

    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    if (application.applicantId.toString() !== userId) {
      throw new ForbiddenException('只能撤销自己的申请');
    }

    if (application.status !== 'pending') {
      throw new BadRequestException('只能撤销待审批的申请');
    }

    await this.prisma.fundApplication.update({
      where: { id: BigInt(applicationId) },
      data: {
        status: 'cancelled',
        currentApproverId: null,
      },
    });

    return { message: '申请已撤销' };
  }

  // 格式化申请响应
  private formatApplicationResponse(application: any) {
    if (!application) return null;

    return {
      ...application,
      id: application.id.toString(),
      applicantId: application.applicantId.toString(),
      crowdfundingId: application.crowdfundingId.toString(),
      periodId: application.periodId.toString(),
      currentApproverId: application.currentApproverId?.toString() || null,
      amount: Number(application.amount),
      applicant: application.applicant
        ? {
            ...application.applicant,
            id: application.applicant.id.toString(),
          }
        : undefined,
      crowdfunding: application.crowdfunding
        ? {
            ...application.crowdfunding,
            id: application.crowdfunding.id.toString(),
          }
        : undefined,
      period: application.period
        ? {
            ...application.period,
            id: application.period.id.toString(),
          }
        : undefined,
      currentApprover: application.currentApprover
        ? {
            ...application.currentApprover,
            id: application.currentApprover.id.toString(),
          }
        : undefined,
      approvals: application.approvals?.map((approval: any) => ({
        ...approval,
        id: approval.id.toString(),
        applicationId: approval.applicationId.toString(),
        approverId: approval.approverId.toString(),
        approver: approval.approver
          ? {
              ...approval.approver,
              id: approval.approver.id.toString(),
            }
          : undefined,
      })),
    };
  }
}
