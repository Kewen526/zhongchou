import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PeriodsService {
  constructor(private prisma: PrismaService) {}

  // 获取或创建当前期数
  async getCurrentPeriod() {
    const now = new Date();
    const year = now.getFullYear();

    // 计算当前周数（ISO周数）
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekOfYear = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    // 查找当前期数
    let period = await this.prisma.period.findUnique({
      where: {
        year_weekOfYear: {
          year,
          weekOfYear,
        },
      },
    });

    // 如果不存在，创建新期数
    if (!period) {
      // 计算本周的开始和结束日期
      const dayOfWeek = now.getDay();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      // 获取最大期数编号
      const maxPeriod = await this.prisma.period.findFirst({
        orderBy: { periodNumber: 'desc' },
      });

      const periodNumber = (maxPeriod?.periodNumber || 0) + 1;

      // 关闭之前的活跃期数
      await this.prisma.period.updateMany({
        where: { status: 'active' },
        data: { status: 'closed' },
      });

      period = await this.prisma.period.create({
        data: {
          periodNumber,
          year,
          weekOfYear,
          startDate,
          endDate,
          status: 'active',
        },
      });
    }

    return this.formatPeriodResponse(period);
  }

  // 获取所有期数列表
  async findAll(page: number = 1, pageSize: number = 10) {
    const [periods, total] = await Promise.all([
      this.prisma.period.findMany({
        orderBy: { periodNumber: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.period.count(),
    ]);

    return {
      items: periods.map((period) => this.formatPeriodResponse(period)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取期数详情
  async findOne(id: string) {
    const period = await this.prisma.period.findUnique({
      where: { id: BigInt(id) },
    });

    if (!period) {
      return null;
    }

    return this.formatPeriodResponse(period);
  }

  // 更新众筹项目的期数（每周自动滚动）
  async rolloverCrowdfundingPeriods() {
    const currentPeriod = await this.getCurrentPeriod();

    // 更新所有进行中的众筹项目到当前期数
    await this.prisma.crowdfunding.updateMany({
      where: { status: 'in_progress' },
      data: { currentPeriodId: BigInt(currentPeriod.id) },
    });

    return currentPeriod;
  }

  private formatPeriodResponse(period: any) {
    return {
      ...period,
      id: period.id.toString(),
    };
  }
}
