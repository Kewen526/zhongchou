import { IsOptional, IsString, IsEnum, IsInt, Min, IsDateString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CrowdfundingProjectStatus } from '@prisma/client';

export class QueryCrowdfundingDto {
  @ApiPropertyOptional({ description: '标题（模糊搜索）' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '状态', enum: CrowdfundingProjectStatus })
  @IsOptional()
  @IsEnum(CrowdfundingProjectStatus)
  status?: CrowdfundingProjectStatus;

  @ApiPropertyOptional({ description: '期数ID' })
  @IsOptional()
  @IsString()
  periodId?: string;

  @ApiPropertyOptional({ description: '创建者ID' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ description: '产品ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: '开始日期（创建时间）', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期（创建时间）', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '最小目标金额' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: '最大目标金额' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}
