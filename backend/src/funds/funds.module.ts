import { Module } from '@nestjs/common';
import { FundsService } from './funds.service';
import { FundsController } from './funds.controller';
import { CrowdfundingsModule } from '../crowdfundings/crowdfundings.module';

@Module({
  imports: [CrowdfundingsModule],
  controllers: [FundsController],
  providers: [FundsService],
  exports: [FundsService],
})
export class FundsModule {}
