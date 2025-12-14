import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFundApplicationDto {
  @ApiProperty({ description: '众筹项目ID', example: '1' })
  @IsString()
  @IsNotEmpty({ message: '众筹项目ID不能为空' })
  crowdfundingId: string;

  @ApiProperty({ description: '申请金额', example: 5000 })
  @IsNumber()
  @Min(1, { message: '申请金额必须大于0' })
  amount: number;

  @ApiPropertyOptional({ description: '申请理由' })
  @IsOptional()
  @IsString()
  reason?: string;
}
