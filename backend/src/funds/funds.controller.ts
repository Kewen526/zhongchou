import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FundsService } from './funds.service';
import { CreateFundApplicationDto, ApproveDto, QueryFundApplicationDto, QueryFundOverviewDto } from './dto';
import { CurrentUser, RequireModules } from '../common/decorators';
import { ModulesGuard } from '../common/guards';

@ApiTags('资金管理')
@Controller('funds')
@UseGuards(AuthGuard('jwt'), ModulesGuard)
@ApiBearerAuth()
@RequireModules('fund')
export class FundsController {
  constructor(private readonly fundsService: FundsService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取资金总览' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getOverview(@Query() queryDto: QueryFundOverviewDto) {
    return this.fundsService.getOverview(queryDto);
  }

  @Get('applications')
  @ApiOperation({ summary: '获取资金申请列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAllApplications(
    @Query() queryDto: QueryFundApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.fundsService.findAllApplications(queryDto, user.id, user.role);
  }

  @Get('pending-approvals')
  @ApiOperation({ summary: '获取待审批列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getPendingApprovals(@CurrentUser('id') userId: string) {
    return this.fundsService.getPendingApprovals(userId);
  }

  @Post('applications')
  @ApiOperation({ summary: '创建资金使用申请' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '无权申请' })
  createApplication(
    @Body() createDto: CreateFundApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.fundsService.createApplication(createDto, user.id, user.role);
  }

  @Patch('applications/:id/approve')
  @ApiOperation({ summary: '审批申请' })
  @ApiParam({ name: 'id', description: '申请ID' })
  @ApiResponse({ status: 200, description: '审批成功' })
  @ApiResponse({ status: 403, description: '您不是当前审批人' })
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveDto,
    @CurrentUser() user: any,
  ) {
    return this.fundsService.approve(id, approveDto, user.id, user.role);
  }

  @Patch('applications/:id/cancel')
  @ApiOperation({ summary: '撤销申请' })
  @ApiParam({ name: 'id', description: '申请ID' })
  @ApiResponse({ status: 200, description: '撤销成功' })
  @ApiResponse({ status: 403, description: '只能撤销自己的申请' })
  cancelApplication(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.fundsService.cancelApplication(id, userId);
  }
}
