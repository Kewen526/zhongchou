import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

// Feature Modules
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CrowdfundingsModule } from './crowdfundings/crowdfundings.module';
import { FundsModule } from './funds/funds.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Core
    PrismaModule,
    AuthModule,

    // Features
    UsersModule,
    ProductsModule,
    CrowdfundingsModule,
    FundsModule,
    LogsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
