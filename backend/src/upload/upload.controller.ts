import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Delete,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('文件上传')
@Controller('upload')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @ApiOperation({ summary: '上传单个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '要上传的文件',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '上传成功',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '文件访问URL' },
        filename: { type: 'string', description: '文件名' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '文件类型或大小不符合要求' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file);
  }

  @Post('multiple')
  @ApiOperation({ summary: '批量上传文件（最多10个）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '要上传的文件列表',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '上传成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '文件访问URL' },
          filename: { type: 'string', description: '文件名' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '文件类型或大小不符合要求' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadFiles(files);
  }

  @Delete()
  @ApiOperation({ summary: '删除文件' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '要删除的文件URL' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '无效的文件URL' })
  async deleteFile(@Body('url') url: string) {
    await this.uploadService.deleteFile(url);
    return { message: '文件删除成功' };
  }
}
