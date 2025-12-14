# 数据库设计文档

## 一、表结构概览

| 序号 | 表名 | 说明 |
|------|------|------|
| 1 | users | 用户表 |
| 2 | products | 产品表 |
| 3 | product_images | 产品图片表 |
| 4 | crowdfundings | 众筹项目表 |
| 5 | investments | 出资记录表 |
| 6 | periods | 期数表 |
| 7 | fund_applications | 资金使用申请表 |
| 8 | approvals | 审批记录表 |
| 9 | operation_logs | 操作日志表 |

---

## 二、详细表设计

### 1. 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| username | VARCHAR(50) | 用户名（唯一） |
| password | VARCHAR(255) | 密码（加密存储） |
| role | ENUM | 角色类型 |
| parent_id | BIGINT | 上级用户ID（隶属关系） |
| module_permissions | JSON | 模块权限 ["product", "crowdfunding", "fund"] |
| status | TINYINT | 状态：1启用 0禁用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**角色枚举值：**
- super_admin: 超级管理员
- admin: 普通管理员
- product_dev: 产品开发
- sales: 销售
- supplier: 供应商
- supplier_sub: 供应商子账号
- factory: 加工厂
- factory_sub: 加工厂子账号

**隶属关系：**
- 销售 → parent_id 指向普通管理员
- 供应商子账号 → parent_id 指向供应商
- 加工厂 → parent_id 指向供应商
- 加工厂子账号 → parent_id 指向加工厂

---

### 2. 产品表 (products)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| name | VARCHAR(100) | 产品名称 |
| product_code | VARCHAR(50) | 产品货号 |
| sku | VARCHAR(50) | 产品SKU |
| link | VARCHAR(500) | 产品链接 |
| factory_id | BIGINT | 对接工厂ID |
| factory_price | DECIMAL(10,2) | 出厂价 |
| price_control | VARCHAR(100) | 价格管控 |
| weight | INT | 产品重量（克） |
| package_size | VARCHAR(100) | 包装尺寸 |
| patent_status | VARCHAR(50) | 专利状态 |
| crowdfunding_status | ENUM | 众筹状态 |
| creator_id | BIGINT | 创建者ID |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**众筹状态枚举：**
- not_started: 未发起众筹
- in_progress: 众筹进行中
- success: 众筹成功
- failed: 众筹失败
- cancelled: 众筹已取消

---

### 3. 产品图片表 (product_images)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| product_id | BIGINT | 产品ID |
| image_url | VARCHAR(500) | 图片URL |
| image_type | ENUM | 图片类型：main(主图)/real(实拍) |
| sort_order | INT | 排序 |
| created_at | DATETIME | 创建时间 |

---

### 4. 众筹项目表 (crowdfundings)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| product_id | BIGINT | 关联产品ID |
| title | VARCHAR(200) | 众筹标题 |
| description | TEXT | 众筹说明 |
| target_amount | DECIMAL(12,2) | 目标金额 |
| current_amount | DECIMAL(12,2) | 当前已筹金额 |
| min_investment | DECIMAL(10,2) | 最小出资金额（默认100） |
| deadline | DATETIME | 截止时间（参考） |
| current_period_id | BIGINT | 当前期数ID |
| status | ENUM | 状态 |
| winner_supplier_id | BIGINT | 中标供应商ID |
| creator_id | BIGINT | 发起人ID |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| cancelled_at | DATETIME | 取消时间 |
| cancelled_by | BIGINT | 取消人ID |

**状态枚举：**
- in_progress: 进行中
- success: 成功
- failed: 失败
- cancelled: 已取消

---

### 5. 出资记录表 (investments)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| crowdfunding_id | BIGINT | 众筹项目ID |
| user_id | BIGINT | 出资人ID |
| amount | DECIMAL(10,2) | 出资金额 |
| investment_type | ENUM | 出资类型：initial(首次)/additional(追加) |
| period_id | BIGINT | 出资时所属期数 |
| created_at | DATETIME | 出资时间 |

---

### 6. 期数表 (periods)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| period_number | INT | 期数编号（如：1, 2, 3...） |
| year | INT | 年份 |
| week_of_year | INT | 一年中的第几周 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| status | ENUM | 状态：active/closed |
| created_at | DATETIME | 创建时间 |

---

### 7. 资金使用申请表 (fund_applications)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| applicant_id | BIGINT | 申请人ID |
| crowdfunding_id | BIGINT | 关联众筹项目ID |
| amount | DECIMAL(10,2) | 申请金额 |
| reason | TEXT | 申请理由 |
| status | ENUM | 状态 |
| current_approver_id | BIGINT | 当前审批人ID |
| created_at | DATETIME | 申请时间 |
| updated_at | DATETIME | 更新时间 |

**状态枚举：**
- pending: 待审批
- approved: 已通过
- rejected: 已拒绝
- cancelled: 已撤销

---

### 8. 审批记录表 (approvals)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| application_id | BIGINT | 申请ID |
| approver_id | BIGINT | 审批人ID |
| action | ENUM | 操作：approve/reject |
| comment | TEXT | 审批意见 |
| created_at | DATETIME | 审批时间 |

---

### 9. 操作日志表 (operation_logs)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 操作人ID |
| module | VARCHAR(50) | 模块名称 |
| action | VARCHAR(50) | 操作类型 |
| target_type | VARCHAR(50) | 目标类型 |
| target_id | BIGINT | 目标ID |
| before_data | JSON | 操作前数据 |
| after_data | JSON | 操作后数据 |
| ip_address | VARCHAR(50) | IP地址 |
| user_agent | VARCHAR(500) | 浏览器信息 |
| created_at | DATETIME | 操作时间 |

---

## 三、索引设计

### users 表
- UNIQUE INDEX: username
- INDEX: parent_id
- INDEX: role
- INDEX: status

### products 表
- INDEX: creator_id
- INDEX: crowdfunding_status
- INDEX: factory_id

### crowdfundings 表
- INDEX: product_id
- INDEX: creator_id
- INDEX: status
- INDEX: current_period_id

### investments 表
- INDEX: crowdfunding_id
- INDEX: user_id
- INDEX: period_id
- UNIQUE INDEX: (crowdfunding_id, user_id, investment_type) - 防止重复首次出资

### fund_applications 表
- INDEX: applicant_id
- INDEX: crowdfunding_id
- INDEX: status

### operation_logs 表
- INDEX: user_id
- INDEX: module
- INDEX: created_at

---

## 四、供应商出资总额约束

由于供应商及其子账号的出资总额不能相同，需要在业务层实现：

1. 查询供应商ID及其所有子账号ID
2. 计算该供应商组的当前出资总额
3. 检查新出资后的总额是否与其他供应商组重复
4. 如重复，拒绝出资

---

## 五、关系图

```
users (1) ----< (n) users (自关联：隶属关系)
users (1) ----< (n) products (创建者)
users (1) ----< (n) crowdfundings (发起人)
users (1) ----< (n) investments (出资人)
users (1) ----< (n) fund_applications (申请人)
users (1) ----< (n) approvals (审批人)

products (1) ----< (n) product_images
products (1) ---- (1) crowdfundings

crowdfundings (1) ----< (n) investments
crowdfundings (n) ---- (1) periods

fund_applications (1) ----< (n) approvals
```
