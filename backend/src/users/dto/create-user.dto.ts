import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ModulePermission } from '../../common/decorators';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度至少6位' })
  password: string;

  @ApiProperty({
    description: '角色类型',
    enum: UserRole,
    example: 'sales',
  })
  @IsEnum(UserRole, { message: '无效的角色类型' })
  role: UserRole;

  @ApiPropertyOptional({ description: '上级用户ID（隶属关系）', example: '1' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    description: '模块权限',
    type: [String],
    example: ['product', 'crowdfunding'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '至少分配一个模块权限' })
  @IsEnum(['product', 'crowdfunding', 'fund'] as const, {
    each: true,
    message: '无效的模块权限',
  })
  modulePermissions: ModulePermission[];
}
