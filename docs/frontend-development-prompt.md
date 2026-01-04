# 众筹系统前端开发提示词

> 请根据以下需求文档开发一个完整的前端应用

---

## 一、项目概述

### 1.1 系统定位
公司内部使用的产品管理众筹平台，用于管理产品开发、内部众筹、供应商竞价、资金使用等业务流程。

### 1.2 后端信息
- **后端框架**: NestJS (已部署完成)
- **API基础路径**: `http://你的服务器IP:3000/api`
- **API文档**: `http://你的服务器IP:3000/api/docs` (Swagger)
- **认证方式**: JWT Bearer Token

### 1.3 前端技术栈要求
| 技术 | 推荐选择 |
|------|---------|
| 框架 | React 18+ 或 Vue 3+ |
| UI库 | Ant Design / Element Plus |
| 状态管理 | Zustand / Pinia |
| 路由 | React Router / Vue Router |
| HTTP请求 | Axios |
| 构建工具 | Vite |
| 语言 | TypeScript |

---

## 二、用户角色体系

### 2.1 角色定义（8种角色）

| 角色 | 英文标识 | 说明 |
|------|---------|------|
| 超级管理员 | `super_admin` | 系统最高权限，可管理用户 |
| 普通管理员 | `admin` | 部门管理 |
| 产品开发 | `product_dev` | 产品创建和管理 |
| 销售 | `sales` | 产品创建，发起众筹 |
| 供应商 | `supplier` | 发起众筹，竞价出资 |
| 供应商子账号 | `supplier_sub` | 竞价出资 |
| 加工厂 | `factory` | 产品加工（不参与众筹） |
| 加工厂子账号 | `factory_sub` | 隶属于加工厂 |

### 2.2 隶属关系图

```
超级管理员 (super_admin)
    ├── 普通管理员 (admin)
    │       └── 销售 (sales)
    ├── 产品开发 (product_dev)
    └── 供应商 (supplier)
            ├── 供应商子账号 (supplier_sub)
            └── 加工厂 (factory)
                    └── 加工厂子账号 (factory_sub)
```

### 2.3 模块权限

系统采用 **角色 + 模块** 双重权限控制：

| 模块 | 权限标识 |
|------|---------|
| 产品管理 | `product` |
| 众筹管理 | `crowdfunding` |
| 资金管理 | `fund` |

**注意**：用户管理模块仅超级管理员可访问，无需模块权限控制。

---

## 三、页面需求

### 3.1 公共页面

#### 登录页 `/login`
- 用户名输入框
- 密码输入框
- 登录按钮
- 登录成功后保存JWT Token到localStorage
- 根据用户权限跳转到对应首页

### 3.2 布局要求

#### 侧边栏菜单（根据用户权限动态显示）
```
├── 首页/工作台
├── 产品管理 (需要product权限)
│   ├── 产品列表
│   └── 创建产品
├── 众筹管理 (需要crowdfunding权限)
│   ├── 众筹列表
│   └── 期数管理
├── 资金管理 (需要fund权限)
│   ├── 资金总览
│   ├── 资金申请列表
│   └── 待审批列表
├── 操作日志 (仅admin/super_admin)
└── 用户管理 (仅super_admin)
    ├── 用户列表
    └── 创建用户
```

#### 顶部导航栏
- Logo/系统名称
- 当前用户信息
- 退出登录按钮

### 3.3 用户管理模块（仅超级管理员）

#### 用户列表页 `/users`
- 表格展示所有用户
- 支持按角色、状态筛选
- 支持用户名搜索
- 操作：编辑、删除、重置密码、启用/禁用

#### 创建用户页 `/users/create`
- 选择角色类型（下拉框）
- 用户名输入
- 密码输入
- 选择上级（根据角色动态显示）
  - 销售 → 选择所属普通管理员
  - 供应商子账号 → 选择所属供应商
  - 加工厂 → 选择所属供应商
  - 加工厂子账号 → 选择所属加工厂
- 勾选模块权限（复选框）

#### 编辑用户页 `/users/:id/edit`
- 同创建页面，但用户名不可修改

### 3.4 产品管理模块

#### 产品列表页 `/products`
- 表格展示产品列表
- 支持多条件筛选：
  - 产品名称（模糊搜索）
  - 产品货号
  - 众筹状态
  - 创建者
- 分页功能
- 操作：查看详情、编辑、删除、发起众筹

#### 创建产品页 `/products/create`
表单字段：
- 产品名称（必填）
- 产品货号（必填）
- 产品SKU
- 产品链接
- 对接工厂（下拉选择）
- 出厂价（数字输入）
- 价格管控（开关）
- 产品重量（克）
- 包装尺寸
- 专利状态（下拉：无专利/专利申请中/已获专利）
- 产品主图（图片上传，多张）
- 产品实拍照片（图片上传，多张）

#### 产品详情页 `/products/:id`
- 展示所有产品信息
- 展示关联的众筹信息
- 操作按钮：编辑、发起众筹

#### 编辑产品页 `/products/:id/edit`
- 同创建页面，预填已有数据

### 3.5 众筹管理模块

#### 众筹列表页 `/crowdfundings`
- 表格展示众筹项目
- 筛选条件：
  - 众筹状态（进行中/成功/失败/已取消）
  - 期数
  - 产品名称
- 显示字段：
  - 产品名称
  - 目标金额
  - 当前金额
  - 进度（百分比进度条）
  - 状态
  - 创建时间
  - 截止时间
- 操作：查看详情、出资、取消

#### 众筹详情页 `/crowdfundings/:id`
- 众筹基本信息
- 进度展示（目标金额 vs 当前金额）
- 供应商出资排名列表（表格）
  - 排名
  - 供应商名称
  - 出资金额
  - 是否中标（成功后显示）
- 出资按钮（首次显示"出资"，已出资显示"追加"）
- 出资弹窗：
  - 金额输入
  - 确认按钮

#### 发起众筹弹窗/页面
- 选择产品（仅显示未众筹的产品）
- 目标金额（必填）
- 截止时间（日期选择）
- 最小出资金额（默认100）
- 众筹说明（选填）

#### 期数管理页 `/crowdfundings/periods`
- 期数列表
- 显示：期数编号、年份、周数、开始日期、结束日期、状态
- 当前期数高亮显示

### 3.6 资金管理模块

#### 资金总览页 `/funds/overview`
- 期数选择下拉框
- 统计卡片：
  - 当期总额
  - 已使用金额
  - 剩余金额
  - 使用率（百分比）
- 资金使用详情列表

#### 资金申请列表页 `/funds/applications`
- 我的申请列表
- 筛选：状态、期数
- 显示：申请金额、原因、状态、申请时间、当前审批人
- 操作：撤销（仅待审批状态）

#### 待审批列表页 `/funds/pending-approvals`
- 待我审批的申请列表
- 显示：申请人、金额、原因、申请时间
- 操作：通过、拒绝（需填写原因）

#### 创建资金申请弹窗
- 选择众筹项目
- 申请金额
- 申请原因

### 3.7 操作日志模块（仅管理员）

#### 日志列表页 `/logs`
- 筛选条件：
  - 操作人
  - 模块
  - 操作类型
  - 时间范围
- 列表字段：
  - 操作人
  - 操作时间
  - 模块
  - 操作类型
  - 目标对象
  - IP地址
- 点击查看详情（显示操作前后数据对比）

---

## 四、API 接口详情

### 4.1 认证接口

#### 登录
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "access_token": "jwt_token_string",
  "user": {
    "id": "string",
    "username": "string",
    "role": "super_admin|admin|product_dev|sales|supplier|supplier_sub|factory|factory_sub",
    "modulePermissions": ["product", "crowdfunding", "fund"],
    "status": 1
  }
}
```

#### 获取当前用户信息
```
GET /api/auth/profile
Authorization: Bearer <token>

Response:
{
  "id": "string",
  "username": "string",
  "role": "string",
  "modulePermissions": ["string"],
  "parentId": "string|null",
  "status": 1
}
```

### 4.2 用户管理接口（需super_admin角色）

#### 获取用户列表
```
GET /api/users?page=1&pageSize=10&role=admin&status=1&username=keyword
Authorization: Bearer <token>

Response:
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

#### 创建用户
```
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "username": "string",
  "password": "string",
  "role": "admin",
  "parentId": "string|null",
  "modulePermissions": ["product", "crowdfunding"],
  "status": 1
}
```

#### 获取用户详情
```
GET /api/users/:id
Authorization: Bearer <token>
```

#### 更新用户
```
PATCH /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "modulePermissions": ["product"],
  "status": 0
}
```

#### 删除用户
```
DELETE /api/users/:id
Authorization: Bearer <token>
```

#### 重置密码
```
POST /api/users/:id/reset-password
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "password": "newPassword123"
}
```

#### 获取可选上级列表
```
GET /api/users/parent-options/:role
Authorization: Bearer <token>

说明：根据角色获取可选的上级用户列表
- sales → 返回所有admin
- supplier_sub → 返回所有supplier
- factory → 返回所有supplier
- factory_sub → 返回所有factory
```

### 4.3 产品管理接口（需product模块权限）

#### 获取产品列表
```
GET /api/products?page=1&pageSize=10&name=keyword&productCode=xxx&crowdfundingStatus=not_started
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "string",
      "name": "产品名称",
      "productCode": "货号",
      "sku": "SKU",
      "link": "链接",
      "factoryId": "string",
      "factory": { "id": "", "username": "" },
      "factoryPrice": 100.00,
      "priceControl": true,
      "weight": 500,
      "packageSize": "10x10x10",
      "patentStatus": "none|pending|granted",
      "crowdfundingStatus": "not_started|in_progress|success|failed|cancelled",
      "creatorId": "string",
      "creator": { "id": "", "username": "" },
      "images": [
        { "id": "", "imageUrl": "", "imageType": "main|real", "sortOrder": 0 }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

#### 创建产品
```
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "产品名称",
  "productCode": "货号",
  "sku": "SKU",
  "link": "https://example.com",
  "factoryId": "工厂用户ID",
  "factoryPrice": 100.00,
  "priceControl": false,
  "weight": 500,
  "packageSize": "10x10x10",
  "patentStatus": "none",
  "images": [
    { "imageUrl": "https://...", "imageType": "main", "sortOrder": 0 },
    { "imageUrl": "https://...", "imageType": "real", "sortOrder": 1 }
  ]
}
```

#### 获取产品详情
```
GET /api/products/:id
Authorization: Bearer <token>
```

#### 更新产品
```
PATCH /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

Request Body: (同创建，字段可选)
```

#### 删除产品
```
DELETE /api/products/:id
Authorization: Bearer <token>
```

### 4.4 众筹管理接口（需crowdfunding模块权限）

#### 获取众筹列表
```
GET /api/crowdfundings?page=1&pageSize=10&status=in_progress&periodId=xxx
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "string",
      "productId": "string",
      "product": { "id": "", "name": "", "productCode": "" },
      "title": "众筹标题",
      "description": "说明",
      "targetAmount": 10000.00,
      "currentAmount": 5000.00,
      "minInvestment": 100.00,
      "deadline": "2024-12-31T23:59:59.000Z",
      "status": "in_progress|success|failed|cancelled",
      "currentPeriodId": "string",
      "currentPeriod": { "id": "", "periodNumber": "2024-W01" },
      "winnerSupplierId": "string|null",
      "winnerSupplier": { "id": "", "username": "" },
      "creatorId": "string",
      "creator": { "id": "", "username": "" },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100
}
```

#### 发起众筹
```
POST /api/crowdfundings
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "productId": "产品ID",
  "title": "众筹标题",
  "description": "众筹说明",
  "targetAmount": 10000.00,
  "deadline": "2024-12-31T23:59:59.000Z",
  "minInvestment": 100.00
}
```

#### 获取众筹详情
```
GET /api/crowdfundings/:id
Authorization: Bearer <token>
```

#### 获取供应商出资排名
```
GET /api/crowdfundings/:id/ranking
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "rank": 1,
      "supplierId": "string",
      "supplierName": "供应商名称",
      "totalAmount": 5000.00,
      "isWinner": true
    }
  ]
}
```

#### 出资
```
POST /api/crowdfundings/invest
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "crowdfundingId": "众筹ID",
  "amount": 1000.00
}
```

#### 追加出资
```
POST /api/crowdfundings/:id/additional-invest
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "amount": 500.00
}
```

#### 取消众筹
```
PATCH /api/crowdfundings/:id/cancel
Authorization: Bearer <token>
```

#### 标记众筹失败
```
PATCH /api/crowdfundings/:id/fail
Authorization: Bearer <token>
```

#### 获取期数列表
```
GET /api/crowdfundings/periods?page=1&pageSize=10
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "string",
      "periodNumber": "2024-W01",
      "year": 2024,
      "weekOfYear": 1,
      "startDate": "2024-01-01",
      "endDate": "2024-01-07",
      "status": "active|closed"
    }
  ],
  "total": 52
}
```

#### 获取当前期数
```
GET /api/crowdfundings/periods/current
Authorization: Bearer <token>

Response:
{
  "id": "string",
  "periodNumber": "2024-W01",
  "year": 2024,
  "weekOfYear": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "status": "active"
}
```

### 4.5 资金管理接口（需fund模块权限）

#### 获取资金总览
```
GET /api/funds/overview?periodId=xxx
Authorization: Bearer <token>

Response:
{
  "totalAmount": 100000.00,
  "usedAmount": 50000.00,
  "remainingAmount": 50000.00,
  "usageRate": 0.5
}
```

#### 获取资金申请列表
```
GET /api/funds/applications?page=1&pageSize=10&status=pending&periodId=xxx
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "string",
      "applicantId": "string",
      "applicant": { "id": "", "username": "" },
      "crowdfundingId": "string",
      "crowdfunding": { "id": "", "title": "" },
      "periodId": "string",
      "period": { "id": "", "periodNumber": "" },
      "amount": 1000.00,
      "reason": "申请原因",
      "status": "pending|approved|rejected|cancelled",
      "currentApproverId": "string",
      "currentApprover": { "id": "", "username": "" },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100
}
```

#### 获取待审批列表
```
GET /api/funds/pending-approvals
Authorization: Bearer <token>
```

#### 创建资金申请
```
POST /api/funds/applications
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "crowdfundingId": "众筹ID",
  "amount": 1000.00,
  "reason": "申请原因"
}
```

#### 审批申请
```
PATCH /api/funds/applications/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "action": "approve|reject",
  "comment": "审批意见"
}
```

#### 撤销申请
```
PATCH /api/funds/applications/:id/cancel
Authorization: Bearer <token>
```

### 4.6 操作日志接口（需admin或super_admin角色）

#### 获取日志列表
```
GET /api/logs?page=1&pageSize=10&userId=xxx&module=product&action=create&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "string",
      "userId": "string",
      "username": "操作人用户名",
      "module": "product|crowdfunding|fund|user",
      "action": "create|update|delete|approve|reject",
      "targetType": "product|crowdfunding|fund_application|user",
      "targetId": "string",
      "beforeData": { ... },
      "afterData": { ... },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1000
}
```

#### 获取日志详情
```
GET /api/logs/:id
Authorization: Bearer <token>
```

#### 获取模块列表
```
GET /api/logs/modules
Authorization: Bearer <token>

Response: ["product", "crowdfunding", "fund", "user"]
```

#### 获取操作类型列表
```
GET /api/logs/actions
Authorization: Bearer <token>

Response: ["create", "update", "delete", "approve", "reject", "invest", "cancel"]
```

---

## 五、前端开发要求

### 5.1 认证处理
- 登录成功后将 `access_token` 存储到 `localStorage`
- 所有API请求在Header中添加 `Authorization: Bearer <token>`
- Token过期（401响应）时自动跳转登录页
- 退出登录时清除本地Token

### 5.2 权限控制
- 根据用户角色动态显示菜单
- 根据 `modulePermissions` 控制模块访问
- 无权限访问时显示403页面或提示

### 5.3 通用组件
- 分页组件
- 搜索筛选表单
- 确认弹窗
- 消息提示（成功/错误/警告）
- 加载状态
- 空数据状态

### 5.4 表单验证
- 必填字段验证
- 金额格式验证（正数，最多2位小数）
- 密码强度提示

### 5.5 响应式设计
- 支持PC端（主要）
- 侧边栏可收缩

### 5.6 错误处理
- 网络错误提示
- API错误信息展示
- 表单提交错误处理

---

## 六、状态枚举值参考

### 用户状态
| 值 | 含义 |
|---|------|
| 1 | 启用 |
| 0 | 禁用 |

### 用户角色
| 值 | 含义 |
|---|------|
| super_admin | 超级管理员 |
| admin | 普通管理员 |
| product_dev | 产品开发 |
| sales | 销售 |
| supplier | 供应商 |
| supplier_sub | 供应商子账号 |
| factory | 加工厂 |
| factory_sub | 加工厂子账号 |

### 产品众筹状态
| 值 | 含义 |
|---|------|
| not_started | 未发起众筹 |
| in_progress | 众筹进行中 |
| success | 众筹成功 |
| failed | 众筹失败 |
| cancelled | 众筹已取消 |

### 众筹状态
| 值 | 含义 |
|---|------|
| in_progress | 进行中 |
| success | 成功 |
| failed | 失败 |
| cancelled | 已取消 |

### 资金申请状态
| 值 | 含义 |
|---|------|
| pending | 待审批 |
| approved | 已通过 |
| rejected | 已拒绝 |
| cancelled | 已撤销 |

### 专利状态
| 值 | 含义 |
|---|------|
| none | 无专利 |
| pending | 专利申请中 |
| granted | 已获专利 |

### 图片类型
| 值 | 含义 |
|---|------|
| main | 主图 |
| real | 实拍图 |

---

## 七、默认账号

系统已初始化超级管理员账号：
- **用户名**: admin
- **密码**: admin123

---

## 八、开发优先级

### P0 - 必须实现
1. 登录/退出
2. 用户管理（列表、创建、编辑、删除）
3. 产品管理（列表、创建、编辑、详情）
4. 众筹管理（列表、发起、出资、详情）
5. 权限控制（菜单、路由守卫）

### P1 - 重要功能
1. 资金管理（总览、申请、审批）
2. 操作日志查看
3. 追加出资功能

### P2 - 后续优化
1. 数据图表展示
2. 导出功能
3. 更完善的错误处理

---

*文档结束 - 请根据此文档开发前端应用*
