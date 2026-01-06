import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const COS = require('cos-nodejs-sdk-v5');

@Injectable()
export class UploadService {
  private cos: any;
  private bucket: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('COS_BUCKET', 'ceshi-1300392622');
    this.region = this.configService.get<string>('COS_REGION', 'ap-beijing');

    this.cos = new COS({
      SecretId: this.configService.get<string>('COS_SECRET_ID'),
      SecretKey: this.configService.get<string>('COS_SECRET_KEY'),
    });
  }

  /**
   * 上传单个文件到腾讯云COS
   */
  async uploadFile(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('未提供文件');
    }

    // 验证文件类型
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型，仅支持: jpg, png, gif, webp, pdf');
    }

    // 验证文件大小 (最大 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('文件大小超过限制 (最大 10MB)');
    }

    // 生成唯一文件名
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    const key = `uploads/${filename}`;

    return new Promise((resolve, reject) => {
      this.cos.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
        (err: any) => {
          if (err) {
            reject(new BadRequestException(`文件上传失败: ${err.message}`));
          } else {
            const url = `https://${this.bucket}.cos.${this.region}.myqcloud.com/${key}`;
            resolve({ url, filename });
          }
        },
      );
    });
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(files: Express.Multer.File[]): Promise<{ url: string; filename: string }[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('未提供文件');
    }

    const results = await Promise.all(files.map((file) => this.uploadFile(file)));
    return results;
  }

  /**
   * 删除文件
   */
  async deleteFile(fileUrl: string): Promise<void> {
    // 从 URL 中提取 key
    const urlPrefix = `https://${this.bucket}.cos.${this.region}.myqcloud.com/`;
    if (!fileUrl.startsWith(urlPrefix)) {
      throw new BadRequestException('无效的文件 URL');
    }

    const key = fileUrl.replace(urlPrefix, '');

    return new Promise((resolve, reject) => {
      this.cos.deleteObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
        },
        (err: any) => {
          if (err) {
            reject(new BadRequestException(`文件删除失败: ${err.message}`));
          } else {
            resolve();
          }
        },
      );
    });
  }
}
