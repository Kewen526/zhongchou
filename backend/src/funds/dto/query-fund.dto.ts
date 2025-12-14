import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FundApplicationStatus } from '@prisma/client';

export class QueryFundApplicationDto {
  @ApiPropertyOptional({ description: '期数ID' })
  @IsOptional()
  @IsString()
  periodId?: string;

  @ApiPropertyOptional({ description: '状态', enum: FundApplicationStatus })
  @IsOptional()
  @IsEnum(FundApplicationStatus)
  status?: FundApplicationStatus;

  @ApiPropertyOptional({ description: '申请人ID' })
  @IsOptional()
  @IsString()
  applicantId?: string;

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

export class QueryFundOverviewDto {
  @ApiPropertyOptional({ description: '期数ID（不传则为当前期）' })
  @IsOptional()
  @IsString()
  periodId?: string;
}
