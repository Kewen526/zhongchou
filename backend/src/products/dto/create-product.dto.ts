import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProductImageDto {
  @ApiProperty({ description: '图片URL' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ description: '图片类型', enum: ['main', 'real'] })
  @IsEnum(['main', 'real'])
  imageType: 'main' | 'real';

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateProductDto {
  @ApiProperty({ description: '产品名称', example: '智能手表' })
  @IsString()
  @IsNotEmpty({ message: '产品名称不能为空' })
  name: string;

  @ApiPropertyOptional({ description: '产品货号', example: 'SW-001' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({ description: '产品SKU', example: 'SKU-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: '产品链接', example: 'https://example.com/product' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({ description: '对接工厂ID', example: '1' })
  @IsOptional()
  @IsString()
  factoryId?: string;

  @ApiPropertyOptional({ description: '出厂价', example: 99.99 })
  @IsOptional()
  @IsNumber()
  factoryPrice?: number;

  @ApiPropertyOptional({ description: '价格管控', example: '建议零售价199元' })
  @IsOptional()
  @IsString()
  priceControl?: string;

  @ApiPropertyOptional({ description: '产品重量（克）', example: 150 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: '包装尺寸', example: '10x10x5cm' })
  @IsOptional()
  @IsString()
  packageSize?: string;

  @ApiPropertyOptional({ description: '专利状态', example: '已申请' })
  @IsOptional()
  @IsString()
  patentStatus?: string;

  @ApiPropertyOptional({ description: '类目', example: '电子产品' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '产品描述', example: '这是一款智能手表，具有心率监测、运动追踪等功能...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '版本', example: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: '专属', example: '平台专属' })
  @IsOptional()
  @IsString()
  exclusive?: string;

  @ApiProperty({ description: '产品图片', type: [ProductImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images: ProductImageDto[];
}
