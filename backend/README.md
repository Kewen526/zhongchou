# 产品管理众筹系统 - 后端

基于 NestJS + Prisma + MySQL 的后端服务。

## 技术栈

- **框架**: NestJS
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: MySQL 8.0
- **认证**: JWT
- **文档**: Swagger

## 项目结构

```
backend/
├── prisma/
│   ├── schema.prisma     # 数据库模型定义
│   └── seed.ts           # 数据库种子脚本
├── src/
│   ├── auth/             # 认证模块
│   ├── users/            # 用户管理模块
│   ├── products/         # 产品管理模块
│   ├── crowdfundings/    # 众筹管理模块
│   ├── funds/            # 资金管理模块
│   ├── logs/             # 操作日志模块
│   ├── prisma/           # Prisma 服务
│   ├── common/           # 通用工具
│   │   ├── decorators/   # 自定义装饰器
│   │   ├── guards/       # 守卫
│   │   └── interceptors/ # 拦截器
│   ├── app.module.ts     # 主模块
│   └── main.ts           # 入口文件
└── .env                  # 环境变量
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库连接
DATABASE_URL="mysql://username:password@localhost:3306/crowdfunding_system"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# 应用配置
PORT=3000
NODE_ENV=development
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 同步数据库结构
npm run prisma:push

# 初始化数据（创建超级管理员）
npm run prisma:seed

# 或者一键执行
npm run db:setup
```

### 4. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 5. 访问 API 文档

启动后访问 Swagger 文档：

```
http://localhost:3000/api/docs
```

## 默认账号

初始化后的超级管理员账号：

- 用户名: `admin`
- 密码: `admin123`

## API 模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/auth` | 登录、获取用户信息 |
| 用户管理 | `/api/users` | 用户CRUD（仅超级管理员） |
| 产品管理 | `/api/products` | 产品CRUD |
| 众筹管理 | `/api/crowdfundings` | 众筹发起、出资、状态管理 |
| 资金管理 | `/api/funds` | 资金申请、审批 |
| 操作日志 | `/api/logs` | 日志查询（仅管理员） |

## 权限说明

### 角色

| 角色 | 英文标识 | 说明 |
|------|---------|------|
| 超级管理员 | super_admin | 系统全局管理 |
| 普通管理员 | admin | 部门管理 |
| 产品开发 | product_dev | 产品创建、众筹 |
| 销售 | sales | 产品创建、众筹 |
| 供应商 | supplier | 众筹（竞价） |
| 供应商子账号 | supplier_sub | 众筹（竞价） |
| 加工厂 | factory | 产品加工 |
| 加工厂子账号 | factory_sub | 产品加工 |

### 模块权限

- `product`: 产品管理
- `crowdfunding`: 众筹管理
- `fund`: 资金管理

## 开发命令

```bash
# 开发模式启动
npm run start:dev

# 构建
npm run build

# 代码格式化
npm run format

# 代码检查
npm run lint

# 运行测试
npm run test
```
