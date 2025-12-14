import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { LogsService } from './logs.service';
import { QueryLogDto } from './dto';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';

@ApiTags('操作日志')
@Controller('logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @Roles(UserRole.super_admin, UserRole.admin)
  @ApiOperation({ summary: '获取操作日志列表（仅管理员）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() queryDto: QueryLogDto) {
    return this.logsService.findAll(queryDto);
  }

  @Get('modules')
  @Roles(UserRole.super_admin, UserRole.admin)
  @ApiOperation({ summary: '获取模块列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getModules() {
    return this.logsService.getModules();
  }

  @Get('actions')
  @Roles(UserRole.super_admin, UserRole.admin)
  @ApiOperation({ summary: '获取操作类型列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getActions() {
    return this.logsService.getActions();
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.admin)
  @ApiOperation({ summary: '获取日志详情' })
  @ApiParam({ name: 'id', description: '日志ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(id);
  }
}
