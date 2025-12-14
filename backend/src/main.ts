import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('产品管理众筹系统 API')
    .setDescription('产品管理众筹系统后端接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('认证', '用户登录认证')
    .addTag('用户管理', '用户账号管理（仅超级管理员）')
    .addTag('产品管理', '产品创建和管理')
    .addTag('众筹管理', '众筹发起、出资、状态管理')
    .addTag('资金管理', '资金使用申请和审批')
    .addTag('操作日志', '系统操作日志查询')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
