import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveDto {
  @ApiProperty({ description: '操作', enum: ['approve', 'reject'] })
  @IsEnum(['approve', 'reject'], { message: '操作必须是 approve 或 reject' })
  action: 'approve' | 'reject';

  @ApiPropertyOptional({ description: '审批意见' })
  @IsOptional()
  @IsString()
  comment?: string;
}
