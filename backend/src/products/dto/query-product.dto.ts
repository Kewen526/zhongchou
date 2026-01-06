import { IsOptional, IsString, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CrowdfundingStatus } from '@prisma/client';

export class QueryProductDto {
  @ApiPropertyOptional({ description: '产品名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '产品货号' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({ description: '众筹状态', enum: CrowdfundingStatus })
  @IsOptional()
  @IsEnum(CrowdfundingStatus)
  crowdfundingStatus?: CrowdfundingStatus;

  @ApiPropertyOptional({ description: '创建者ID' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ description: '工厂ID' })
  @IsOptional()
  @IsString()
  factoryId?: string;

  @ApiPropertyOptional({ description: '开始日期（创建时间）', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期（创建时间）', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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
