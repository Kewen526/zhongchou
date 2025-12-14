import { Module } from '@nestjs/common';
import { CrowdfundingsService } from './crowdfundings.service';
import { CrowdfundingsController } from './crowdfundings.controller';
import { PeriodsService } from './periods.service';

@Module({
  controllers: [CrowdfundingsController],
  providers: [CrowdfundingsService, PeriodsService],
  exports: [CrowdfundingsService, PeriodsService],
})
export class CrowdfundingsModule {}
