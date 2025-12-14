import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCrowdfundingDto {
  @ApiProperty({ description: '产品ID', example: '1' })
  @IsString()
  @IsNotEmpty({ message: '产品ID不能为空' })
  productId: string;

  @ApiProperty({ description: '众筹标题', example: '智能手表众筹项目' })
  @IsString()
  @IsNotEmpty({ message: '众筹标题不能为空' })
  title: string;

  @ApiPropertyOptional({ description: '众筹说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '目标金额', example: 100000 })
  @IsNumber()
  @Min(1, { message: '目标金额必须大于0' })
  targetAmount: number;

  @ApiPropertyOptional({ description: '最小出资金额', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(100, { message: '最小出资金额不能低于100' })
  minInvestment?: number;

  @ApiPropertyOptional({ description: '截止时间（参考）' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
