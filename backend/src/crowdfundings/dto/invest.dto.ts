import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InvestDto {
  @ApiProperty({ description: '众筹项目ID', example: '1' })
  @IsString()
  @IsNotEmpty({ message: '众筹项目ID不能为空' })
  crowdfundingId: string;

  @ApiProperty({ description: '出资金额', example: 1000 })
  @IsNumber()
  @Min(100, { message: '出资金额不能低于100元' })
  amount: number;
}

export class AdditionalInvestDto {
  @ApiProperty({ description: '追加金额', example: 500 })
  @IsNumber()
  @Min(100, { message: '追加金额不能低于100元' })
  amount: number;
}
