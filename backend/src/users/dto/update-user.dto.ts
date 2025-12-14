import {
  IsString,
  IsOptional,
  MinLength,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ModulePermission } from '../../common/decorators';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '密码', example: '123456' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码长度至少6位' })
  password?: string;

  @ApiPropertyOptional({ description: '上级用户ID', example: '1' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: '模块权限',
    type: [String],
    example: ['product', 'crowdfunding'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['product', 'crowdfunding', 'fund'] as const, {
    each: true,
    message: '无效的模块权限',
  })
  modulePermissions?: ModulePermission[];

  @ApiPropertyOptional({ description: '状态：1启用 0禁用', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;
}
