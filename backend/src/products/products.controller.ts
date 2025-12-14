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
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';
import { CurrentUser, RequireModules } from '../common/decorators';
import { ModulesGuard } from '../common/guards';

@ApiTags('产品管理')
@Controller('products')
@UseGuards(AuthGuard('jwt'), ModulesGuard)
@ApiBearerAuth()
@RequireModules('product')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: '创建产品' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.create(createProductDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取产品列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() queryDto: QueryProductDto) {
    return this.productsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取产品详情' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新产品' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '无权编辑此产品' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.update(id, updateProductDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除产品' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '产品有进行中的众筹，无法删除' })
  @ApiResponse({ status: 403, description: '无权删除此产品' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.remove(id, userId);
  }
}
