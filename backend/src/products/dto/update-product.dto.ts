import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductImageDto } from './create-product.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({ description: '产品名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '产品货号' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({ description: '产品SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: '产品链接' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({ description: '对接工厂ID' })
  @IsOptional()
  @IsString()
  factoryId?: string;

  @ApiPropertyOptional({ description: '出厂价' })
  @IsOptional()
  @IsNumber()
  factoryPrice?: number;

  @ApiPropertyOptional({ description: '价格管控' })
  @IsOptional()
  @IsString()
  priceControl?: string;

  @ApiPropertyOptional({ description: '产品重量（克）' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: '包装尺寸' })
  @IsOptional()
  @IsString()
  packageSize?: string;

  @ApiPropertyOptional({ description: '专利状态' })
  @IsOptional()
  @IsString()
  patentStatus?: string;

  @ApiPropertyOptional({ description: '类目' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '产品描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '版本' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: '专属' })
  @IsOptional()
  @IsString()
  exclusive?: string;

  @ApiPropertyOptional({ description: '产品图片', type: [ProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}
