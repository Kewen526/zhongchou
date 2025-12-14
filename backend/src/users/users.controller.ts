import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.super_admin)
  @ApiOperation({ summary: '创建用户（仅超级管理员）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.super_admin)
  @ApiOperation({ summary: '获取用户列表（仅超级管理员）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() queryDto: QueryUserDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get('parent-options/:role')
  @Roles(UserRole.super_admin)
  @ApiOperation({ summary: '获取角色的可选上级列表' })
  @ApiParam({ name: 'role', enum: UserRole })
  @ApiResponse({ status: 200, description: '获取成功' })
  getParentOptions(@Param('role') role: UserRole) {
    return this.usersService.getParentOptions(role);
  }

  @Get(':id')
  @Roles(UserRole.super_admin)
  @ApiOperation({ summary: '获取用户详情（仅超级管理员）' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin)
  @ApiOperation({ summary: '更新用户（仅超级管理员）' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin)
  @ApiOperation({ summary: '删除用户（仅超级管理员）' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '用户有下级账号，无法删除' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.super_admin)
  @ApiOperation({ summary: '重置用户密码（仅超级管理员）' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '重置成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  resetPassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return this.usersService.resetPassword(id, password);
  }
}
