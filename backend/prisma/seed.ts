import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 创建超级管理员
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'super_admin',
      modulePermissions: ['product', 'crowdfunding', 'fund'],
      status: 1,
    },
  });

  console.log('Created super admin:', admin.username);

  // 创建初始期数
  const now = new Date();
  const year = now.getFullYear();

  // 计算当前周数
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekOfYear = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  // 计算本周的开始和结束日期
  const dayOfWeek = now.getDay();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const period = await prisma.period.upsert({
    where: {
      year_weekOfYear: {
        year,
        weekOfYear,
      },
    },
    update: {},
    create: {
      periodNumber: 1,
      year,
      weekOfYear,
      startDate,
      endDate,
      status: 'active',
    },
  });

  console.log('Created initial period:', period.periodNumber);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
