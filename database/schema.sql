-- =====================================================
-- 产品管理众筹系统 - 数据库建表脚本
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS crowdfunding_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE crowdfunding_system;

-- =====================================================
-- 1. 用户表
-- =====================================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    role ENUM(
        'super_admin',    -- 超级管理员
        'admin',          -- 普通管理员
        'product_dev',    -- 产品开发
        'sales',          -- 销售
        'supplier',       -- 供应商
        'supplier_sub',   -- 供应商子账号
        'factory',        -- 加工厂
        'factory_sub'     -- 加工厂子账号
    ) NOT NULL COMMENT '角色类型',
    parent_id BIGINT UNSIGNED NULL COMMENT '上级用户ID（隶属关系）',
    module_permissions JSON COMMENT '模块权限 ["product","crowdfunding","fund"]',
    status TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE INDEX idx_username (username),
    INDEX idx_parent_id (parent_id),
    INDEX idx_role (role),
    INDEX idx_status (status),

    CONSTRAINT fk_users_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 2. 期数表
-- =====================================================
CREATE TABLE periods (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    period_number INT UNSIGNED NOT NULL COMMENT '期数编号（累计）',
    year INT UNSIGNED NOT NULL COMMENT '年份',
    week_of_year INT UNSIGNED NOT NULL COMMENT '一年中的第几周',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    status ENUM('active', 'closed') DEFAULT 'active' COMMENT '状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    UNIQUE INDEX idx_year_week (year, week_of_year),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='期数表';

-- =====================================================
-- 3. 产品表
-- =====================================================
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '产品名称',
    product_code VARCHAR(50) NULL COMMENT '产品货号',
    sku VARCHAR(50) NULL COMMENT '产品SKU',
    link VARCHAR(500) NULL COMMENT '产品链接',
    factory_id BIGINT UNSIGNED NULL COMMENT '对接工厂ID',
    factory_price DECIMAL(10, 2) NULL COMMENT '出厂价',
    price_control VARCHAR(100) NULL COMMENT '价格管控',
    weight INT UNSIGNED NULL COMMENT '产品重量（克）',
    package_size VARCHAR(100) NULL COMMENT '包装尺寸',
    patent_status VARCHAR(50) NULL COMMENT '专利状态',
    crowdfunding_status ENUM(
        'not_started',  -- 未发起众筹
        'in_progress',  -- 众筹进行中
        'success',      -- 众筹成功
        'failed',       -- 众筹失败
        'cancelled'     -- 众筹已取消
    ) DEFAULT 'not_started' COMMENT '众筹状态',
    creator_id BIGINT UNSIGNED NOT NULL COMMENT '创建者ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_creator_id (creator_id),
    INDEX idx_crowdfunding_status (crowdfunding_status),
    INDEX idx_factory_id (factory_id),

    CONSTRAINT fk_products_creator FOREIGN KEY (creator_id) REFERENCES users(id),
    CONSTRAINT fk_products_factory FOREIGN KEY (factory_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品表';

-- =====================================================
-- 4. 产品图片表
-- =====================================================
CREATE TABLE product_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL COMMENT '产品ID',
    image_url VARCHAR(500) NOT NULL COMMENT '图片URL',
    image_type ENUM('main', 'real') DEFAULT 'main' COMMENT '图片类型：main主图/real实拍',
    sort_order INT UNSIGNED DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    INDEX idx_product_id (product_id),

    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品图片表';

-- =====================================================
-- 5. 众筹项目表
-- =====================================================
CREATE TABLE crowdfundings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL COMMENT '关联产品ID',
    title VARCHAR(200) NOT NULL COMMENT '众筹标题',
    description TEXT NULL COMMENT '众筹说明',
    target_amount DECIMAL(12, 2) NOT NULL COMMENT '目标金额',
    current_amount DECIMAL(12, 2) DEFAULT 0.00 COMMENT '当前已筹金额',
    min_investment DECIMAL(10, 2) DEFAULT 100.00 COMMENT '最小出资金额',
    deadline DATETIME NULL COMMENT '截止时间（参考）',
    current_period_id BIGINT UNSIGNED NULL COMMENT '当前期数ID',
    start_period_id BIGINT UNSIGNED NULL COMMENT '开始期数ID',
    status ENUM(
        'in_progress',  -- 进行中
        'success',      -- 成功
        'failed',       -- 失败
        'cancelled'     -- 已取消
    ) DEFAULT 'in_progress' COMMENT '状态',
    winner_supplier_id BIGINT UNSIGNED NULL COMMENT '中标供应商ID',
    creator_id BIGINT UNSIGNED NOT NULL COMMENT '发起人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    success_at DATETIME NULL COMMENT '成功时间',
    cancelled_at DATETIME NULL COMMENT '取消时间',
    cancelled_by BIGINT UNSIGNED NULL COMMENT '取消人ID',
    failed_at DATETIME NULL COMMENT '失败标记时间',
    failed_by BIGINT UNSIGNED NULL COMMENT '失败标记人ID',

    UNIQUE INDEX idx_product_id (product_id),
    INDEX idx_creator_id (creator_id),
    INDEX idx_status (status),
    INDEX idx_current_period_id (current_period_id),

    CONSTRAINT fk_crowdfundings_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_crowdfundings_creator FOREIGN KEY (creator_id) REFERENCES users(id),
    CONSTRAINT fk_crowdfundings_period FOREIGN KEY (current_period_id) REFERENCES periods(id),
    CONSTRAINT fk_crowdfundings_start_period FOREIGN KEY (start_period_id) REFERENCES periods(id),
    CONSTRAINT fk_crowdfundings_winner FOREIGN KEY (winner_supplier_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_crowdfundings_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_crowdfundings_failed_by FOREIGN KEY (failed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='众筹项目表';

-- =====================================================
-- 6. 出资记录表
-- =====================================================
CREATE TABLE investments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    crowdfunding_id BIGINT UNSIGNED NOT NULL COMMENT '众筹项目ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '出资人ID',
    amount DECIMAL(10, 2) NOT NULL COMMENT '出资金额',
    investment_type ENUM('initial', 'additional') NOT NULL COMMENT '出资类型：initial首次/additional追加',
    period_id BIGINT UNSIGNED NOT NULL COMMENT '出资时所属期数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '出资时间',

    INDEX idx_crowdfunding_id (crowdfunding_id),
    INDEX idx_user_id (user_id),
    INDEX idx_period_id (period_id),

    CONSTRAINT fk_investments_crowdfunding FOREIGN KEY (crowdfunding_id) REFERENCES crowdfundings(id),
    CONSTRAINT fk_investments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_investments_period FOREIGN KEY (period_id) REFERENCES periods(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出资记录表';

-- =====================================================
-- 7. 资金使用申请表
-- =====================================================
CREATE TABLE fund_applications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    applicant_id BIGINT UNSIGNED NOT NULL COMMENT '申请人ID',
    crowdfunding_id BIGINT UNSIGNED NOT NULL COMMENT '关联众筹项目ID',
    period_id BIGINT UNSIGNED NOT NULL COMMENT '所属期数',
    amount DECIMAL(10, 2) NOT NULL COMMENT '申请金额',
    reason TEXT NULL COMMENT '申请理由',
    status ENUM(
        'pending',    -- 待审批
        'approved',   -- 已通过
        'rejected',   -- 已拒绝
        'cancelled'   -- 已撤销
    ) DEFAULT 'pending' COMMENT '状态',
    current_approver_id BIGINT UNSIGNED NULL COMMENT '当前审批人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_applicant_id (applicant_id),
    INDEX idx_crowdfunding_id (crowdfunding_id),
    INDEX idx_period_id (period_id),
    INDEX idx_status (status),
    INDEX idx_current_approver_id (current_approver_id),

    CONSTRAINT fk_fund_applications_applicant FOREIGN KEY (applicant_id) REFERENCES users(id),
    CONSTRAINT fk_fund_applications_crowdfunding FOREIGN KEY (crowdfunding_id) REFERENCES crowdfundings(id),
    CONSTRAINT fk_fund_applications_period FOREIGN KEY (period_id) REFERENCES periods(id),
    CONSTRAINT fk_fund_applications_approver FOREIGN KEY (current_approver_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资金使用申请表';

-- =====================================================
-- 8. 审批记录表
-- =====================================================
CREATE TABLE approvals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT UNSIGNED NOT NULL COMMENT '申请ID',
    approver_id BIGINT UNSIGNED NOT NULL COMMENT '审批人ID',
    action ENUM('approve', 'reject') NOT NULL COMMENT '操作：approve通过/reject拒绝',
    comment TEXT NULL COMMENT '审批意见',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '审批时间',

    INDEX idx_application_id (application_id),
    INDEX idx_approver_id (approver_id),

    CONSTRAINT fk_approvals_application FOREIGN KEY (application_id) REFERENCES fund_applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_approvals_approver FOREIGN KEY (approver_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批记录表';

-- =====================================================
-- 9. 操作日志表
-- =====================================================
CREATE TABLE operation_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL COMMENT '操作人ID',
    username VARCHAR(50) NULL COMMENT '操作人用户名（冗余）',
    module VARCHAR(50) NOT NULL COMMENT '模块名称',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) NULL COMMENT '目标类型',
    target_id BIGINT UNSIGNED NULL COMMENT '目标ID',
    before_data JSON NULL COMMENT '操作前数据',
    after_data JSON NULL COMMENT '操作后数据',
    ip_address VARCHAR(50) NULL COMMENT 'IP地址',
    user_agent VARCHAR(500) NULL COMMENT '浏览器信息',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- =====================================================
-- 10. 供应商出资汇总视图（用于竞价排名）
-- =====================================================
CREATE OR REPLACE VIEW v_supplier_investment_ranking AS
SELECT
    c.id AS crowdfunding_id,
    CASE
        WHEN u.role = 'supplier_sub' THEN u.parent_id
        ELSE u.id
    END AS supplier_id,
    SUM(i.amount) AS total_amount,
    COUNT(DISTINCT i.user_id) AS investor_count,
    MAX(i.created_at) AS last_investment_at
FROM investments i
JOIN users u ON i.user_id = u.id
JOIN crowdfundings c ON i.crowdfunding_id = c.id
WHERE u.role IN ('supplier', 'supplier_sub')
GROUP BY c.id,
    CASE
        WHEN u.role = 'supplier_sub' THEN u.parent_id
        ELSE u.id
    END
ORDER BY c.id, total_amount DESC;

-- =====================================================
-- 初始化数据：创建超级管理员账号
-- 密码: admin123 (需要在应用层加密)
-- =====================================================
INSERT INTO users (username, password, role, module_permissions, status)
VALUES ('admin', '$2b$10$placeholder_hash_replace_in_app', 'super_admin', '["product","crowdfunding","fund"]', 1);

-- =====================================================
-- 初始化当前期数
-- =====================================================
INSERT INTO periods (period_number, year, week_of_year, start_date, end_date, status)
SELECT
    1,
    YEAR(CURDATE()),
    WEEK(CURDATE(), 1),
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
    DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY),
    'active';
