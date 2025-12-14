import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
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
