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
import { CrowdfundingsService } from './crowdfundings.service';
import { PeriodsService } from './periods.service';
import { CreateCrowdfundingDto, InvestDto, AdditionalInvestDto, QueryCrowdfundingDto } from './dto';
import { CurrentUser, RequireModules } from '../common/decorators';
import { ModulesGuard } from '../common/guards';

@ApiTags('众筹管理')
@Controller('crowdfundings')
@UseGuards(AuthGuard('jwt'), ModulesGuard)
@ApiBearerAuth()
@RequireModules('crowdfunding')
export class CrowdfundingsController {
  constructor(
    private readonly crowdfundingsService: CrowdfundingsService,
    private readonly periodsService: PeriodsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '发起众筹' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '无权限发起众筹' })
  @ApiResponse({ status: 409, description: '产品已有进行中的众筹' })
  create(
    @Body() createCrowdfundingDto: CreateCrowdfundingDto,
    @CurrentUser() user: any,
  ) {
    return this.crowdfundingsService.create(createCrowdfundingDto, user.id, user.role);
  }

  @Get()
  @ApiOperation({ summary: '获取众筹列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() queryDto: QueryCrowdfundingDto) {
    return this.crowdfundingsService.findAll(queryDto);
  }

  @Get('periods')
  @ApiOperation({ summary: '获取期数列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getPeriods(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.periodsService.findAll(page, pageSize);
  }

  @Get('periods/current')
  @ApiOperation({ summary: '获取当前期数' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getCurrentPeriod() {
    return this.periodsService.getCurrentPeriod();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取众筹详情' })
  @ApiParam({ name: 'id', description: '众筹ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '众筹项目不存在' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.crowdfundingsService.findOne(id, user.id);
  }

  @Get(':id/ranking')
  @ApiOperation({ summary: '获取供应商出资排名' })
  @ApiParam({ name: 'id', description: '众筹ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getSupplierRanking(@Param('id') id: string) {
    return this.crowdfundingsService.getSupplierRanking(id);
  }

  @Post('invest')
  @ApiOperation({ summary: '出资' })
  @ApiResponse({ status: 201, description: '出资成功' })
  @ApiResponse({ status: 403, description: '无权限出资' })
  @ApiResponse({ status: 409, description: '已出资过/金额重复' })
  invest(
    @Body() investDto: InvestDto,
    @CurrentUser() user: any,
  ) {
    return this.crowdfundingsService.invest(investDto, user.id, user.role);
  }

  @Post(':id/additional-invest')
  @ApiOperation({ summary: '追加出资' })
  @ApiParam({ name: 'id', description: '众筹ID' })
  @ApiResponse({ status: 201, description: '追加出资成功' })
  @ApiResponse({ status: 400, description: '请先进行首次出资' })
  @ApiResponse({ status: 409, description: '金额重复' })
  additionalInvest(
    @Param('id') id: string,
    @Body() additionalInvestDto: AdditionalInvestDto,
    @CurrentUser() user: any,
  ) {
    return this.crowdfundingsService.additionalInvest(id, additionalInvestDto, user.id, user.role);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消众筹' })
  @ApiParam({ name: 'id', description: '众筹ID' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 403, description: '无权取消' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.crowdfundingsService.cancel(id, user.id, user.role);
  }

  @Patch(':id/fail')
  @ApiOperation({ summary: '标记众筹失败' })
  @ApiParam({ name: 'id', description: '众筹ID' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @ApiResponse({ status: 403, description: '无权标记' })
  markAsFailed(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.crowdfundingsService.markAsFailed(id, user.id, user.role);
  }
}
