-- ============================================================
-- FK Shop 初始化数据
-- 首次部署时手动执行一次: psql -U <user> -d <db> -f data.sql
-- 所有 INSERT 均带 WHERE NOT EXISTS，可安全重复执行
-- ============================================================

-- ────────────────────────────────────────
-- 1. 管理员账户 (密码: admin，请首次登录后立即修改)
--    默认使用 BCrypt 哈希。若 application.yml 设置了 security.password-plain: true，
--    则需将下方 password_hash 改为明文 'admin'
-- ────────────────────────────────────────
INSERT INTO users (id, username, email, password_hash, role, points, is_deleted, failed_login_attempts, lock_until, created_at, updated_at)
SELECT gen_random_uuid(), 'admin', 'admin@fk.jixianxiake.xyz',
       '$2b$12$J7FCWJNpL3IuxrRd9dnm7eB5MbqjXhKcmTz6q7SEolfqw7VBEoOWC',
       'ADMIN', 0, 0, 0, NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- ────────────────────────────────────────
-- 2. 站点配置 (config_group = 'site')
-- ────────────────────────────────────────

-- 站点名称，显示在页面标题和 Header
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'site_name', 'FK Shop', 'site', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'site_name');

-- 站点标语，显示在首页 Hero 区域
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'site_slogan', '数字商品自动发货', 'site', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'site_slogan');

-- 站点描述，显示在首页副标题 / SEO
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'site_description', '自助下单，自动交付，支持常见数字商品销售场景。', 'site', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'site_description');

-- 页脚（留空则不显示）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'footer_text', 'FK Shop', 'site', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'footer_text');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'github_url', '', 'site', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'github_url');

-- 客服联系方式（留空则前台自动隐藏）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_email_enabled', 'false', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_email_enabled');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_email', '', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_email');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_qq_enabled', 'false', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_qq_enabled');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_qq', '', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_qq');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_qq_group_enabled', 'false', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_qq_group_enabled');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_qq_group', '', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_qq_group');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_wechat_enabled', 'false', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_wechat_enabled');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_wechat', '', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_wechat');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_wechat_group_enabled', 'false', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_wechat_group_enabled');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_wechat_group', '', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_wechat_group');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_telegram_enabled', 'false', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_telegram_enabled');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_telegram', '', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_telegram');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_telegram_group_enabled', 'false', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_telegram_group_enabled');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_telegram_group', '', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_telegram_group');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_whatsapp_enabled', 'false', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_whatsapp_enabled');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_whatsapp', '', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_whatsapp');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_x_enabled', 'false', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_x_enabled');

INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'contact_x', '', 'contact', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'contact_x');

-- 积分功能总开关 (true/false)
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'points_enabled', 'false', 'site', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'points_enabled');

-- 积分倍率：每消费 1 元获得的积分数
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'points_rate', '1', 'site', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'points_rate');

-- 维护模式开关，开启后非管理员请求返回 503 (true/false)
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'maintenance_enabled', 'false', 'site', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'maintenance_enabled');

-- 全站公告开关 (true/false)
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'announcement_enabled', 'false', 'site', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'announcement_enabled');

-- 弹窗通知开关 (true/false)
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'popup_enabled', 'false', 'site', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'popup_enabled');

-- ────────────────────────────────────────
-- 3. 风控配置 (config_group = 'risk')
-- ────────────────────────────────────────

-- 单 IP 每秒最大请求数（令牌桶容量）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'rate_limit_per_second', '25', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'rate_limit_per_second');

-- 单账号连续登录失败上限（超过后需等待冷却）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'login_attempt_limit', '10', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'login_attempt_limit');

-- 每用户单次最大购买数量
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'max_purchase_per_user', '50', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'max_purchase_per_user');

-- 单 IP 最大未支付订单数（防刷单，共享 IP 场景适当放宽）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'max_pending_orders_per_ip', '5', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'max_pending_orders_per_ip');

-- 单用户最大未支付订单数
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'max_pending_orders_per_user', '5', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'max_pending_orders_per_user');

-- 未支付订单自动过期时间（分钟）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'order_expire_minutes', '15', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'order_expire_minutes');

-- Turnstile 人机验证开关（默认关闭，需后台手动启用）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'turnstile_enabled', 'false', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'turnstile_enabled');

-- 设备指纹限流开关（默认关闭，需后台手动启用）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'device_rate_limit_enabled', 'false', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'device_rate_limit_enabled');

-- 设备指纹限流：下单频率上限（次/小时/设备）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'device_order_limit_per_hour', '15', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'device_order_limit_per_hour');

-- 设备指纹限流：TXID 提交上限（次/小时/设备）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'device_txid_limit_per_hour', '5', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'device_txid_limit_per_hour');

-- TXID 提交上限（次/订单）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'txid_submit_limit_per_order', '3', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'txid_submit_limit_per_order');

-- 设备指纹限流：查询频率上限（次/小时/设备）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'device_query_limit_per_hour', '50', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'device_query_limit_per_hour');

-- 设备指纹限流：登录频率上限（次/小时/设备）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'device_login_limit_per_hour', '10', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'device_login_limit_per_hour');

-- 设备指纹限流：注册频率上限（次/小时/设备）
INSERT INTO site_configs (id, config_key, config_value, config_group, created_at, updated_at)
SELECT gen_random_uuid(), 'device_register_limit_per_hour', '10', 'risk', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE config_key = 'device_register_limit_per_hour');


-- ────────────────────────────────────────
-- 4. 货币类型
-- ────────────────────────────────────────
INSERT INTO currencies (id, code, name, symbol, rate_to_cny, is_enabled, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'CNY', '人民币', '¥', 1.000000, true, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'CNY');

INSERT INTO currencies (id, code, name, symbol, rate_to_cny, is_enabled, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'USD', '美元', '$', 7.200000, true, 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'USD');

INSERT INTO currencies (id, code, name, symbol, rate_to_cny, is_enabled, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'EUR', '欧元', '€', 7.800000, true, 3, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'EUR');

INSERT INTO currencies (id, code, name, symbol, rate_to_cny, is_enabled, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'JPY', '日元', '¥', 0.050000, true, 4, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'JPY');

INSERT INTO currencies (id, code, name, symbol, rate_to_cny, is_enabled, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'KRW', '韩元', '₩', 0.005200, true, 5, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'KRW');

INSERT INTO currencies (id, code, name, symbol, rate_to_cny, is_enabled, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'GBP', '英镑', '£', 9.100000, true, 6, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'GBP');

INSERT INTO currencies (id, code, name, symbol, rate_to_cny, is_enabled, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'USDT', 'USDT', '₮', 7.200000, true, 7, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'USDT');

UPDATE currencies SET rate_to_cny = 1.000000 WHERE code = 'CNY' AND (rate_to_cny IS NULL OR rate_to_cny <= 0);
UPDATE currencies SET rate_to_cny = 7.200000 WHERE code = 'USD' AND (rate_to_cny IS NULL OR rate_to_cny <= 0);
UPDATE currencies SET rate_to_cny = 7.800000 WHERE code = 'EUR' AND (rate_to_cny IS NULL OR rate_to_cny <= 0);
UPDATE currencies SET rate_to_cny = 0.050000 WHERE code = 'JPY' AND (rate_to_cny IS NULL OR rate_to_cny <= 0);
UPDATE currencies SET rate_to_cny = 0.005200 WHERE code = 'KRW' AND (rate_to_cny IS NULL OR rate_to_cny <= 0);
UPDATE currencies SET rate_to_cny = 9.100000 WHERE code = 'GBP' AND (rate_to_cny IS NULL OR rate_to_cny <= 0);
UPDATE currencies SET rate_to_cny = 7.200000 WHERE code = 'USDT' AND (rate_to_cny IS NULL OR rate_to_cny <= 0);

-- ────────────────────────────────────────
-- 5. 测试数据：商品分类 + 商品 + 卡密（开发/演示用，生产可删除此段）
-- ────────────────────────────────────────

-- 分类：数字点卡
INSERT INTO product_categories (id, name, sort_order, is_deleted, created_at, updated_at)
SELECT 'a0000000-0000-0000-0000-000000000001'::uuid, '数字点卡', 1, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE name = '数字点卡');

-- 分类：软件服务
INSERT INTO product_categories (id, name, sort_order, is_deleted, created_at, updated_at)
SELECT 'a0000000-0000-0000-0000-000000000002'::uuid, '软件服务', 2, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE name = '软件服务');

-- 分类：会员订阅
INSERT INTO product_categories (id, name, sort_order, is_deleted, created_at, updated_at)
SELECT 'a0000000-0000-0000-0000-000000000003'::uuid, '会员订阅', 3, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE name = '会员订阅');

-- 商品1：通用点卡 50 面值（数字点卡分类）
INSERT INTO products (id, title, description, base_price, category_id, low_stock_threshold, wholesale_enabled, is_enabled, sort_order, is_deleted, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000001'::uuid, '通用点卡 50 面值',
       '示例数字点卡，购买后自动发货，可用于测试下单、支付与发货流程。',
       50.00, 'a0000000-0000-0000-0000-000000000001'::uuid, 5, false, true, 1, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE title = '通用点卡 50 面值');

-- 商品2：通用点卡 100 面值（数字点卡分类）
INSERT INTO products (id, title, description, base_price, category_id, low_stock_threshold, wholesale_enabled, is_enabled, sort_order, is_deleted, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000002'::uuid, '通用点卡 100 面值',
       '示例数字点卡，适合演示不同面值与多商品库存管理。',
       100.00, 'a0000000-0000-0000-0000-000000000001'::uuid, 5, false, true, 2, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE title = '通用点卡 100 面值');

-- 商品3：专业版软件授权码（软件服务分类）
INSERT INTO products (id, title, description, base_price, category_id, low_stock_threshold, wholesale_enabled, is_enabled, sort_order, is_deleted, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000003'::uuid, '专业版软件授权码',
       '示例软件授权商品，适合测试规格、库存和自动交付能力。',
       298.00, 'a0000000-0000-0000-0000-000000000002'::uuid, 3, true, true, 1, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE title = '专业版软件授权码');

-- 商品4：办公套件年度订阅（软件服务分类）
INSERT INTO products (id, title, description, base_price, category_id, low_stock_threshold, wholesale_enabled, is_enabled, sort_order, is_deleted, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000004'::uuid, '办公套件年度订阅',
       '示例办公服务商品，适合展示订阅型数字商品的售卖流程。',
       399.00, 'a0000000-0000-0000-0000-000000000002'::uuid, 3, false, true, 2, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE title = '办公套件年度订阅');

-- 商品5：影音会员月卡（会员订阅分类）
INSERT INTO products (id, title, description, base_price, category_id, low_stock_threshold, wholesale_enabled, is_enabled, sort_order, is_deleted, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000005'::uuid, '影音会员月卡',
       '示例影音订阅商品，可用于测试会员类商品购买与发货。',
       89.00, 'a0000000-0000-0000-0000-000000000003'::uuid, 5, false, true, 1, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE title = '影音会员月卡');

-- 商品6：音乐会员季卡（会员订阅分类）
INSERT INTO products (id, title, description, base_price, category_id, low_stock_threshold, wholesale_enabled, is_enabled, sort_order, is_deleted, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000006'::uuid, '音乐会员季卡',
       '示例音乐订阅商品，适合测试周期型服务商品的运营配置。',
       78.00, 'a0000000-0000-0000-0000-000000000003'::uuid, 5, false, true, 2, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE title = '音乐会员季卡');

-- 每个商品各插入 3 张测试卡密（库存）
INSERT INTO card_keys (id, product_id, content, status, created_at, updated_at)
SELECT gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001'::uuid, 'CARD50-TEST-' || i, 'AVAILABLE', NOW(), NOW()
FROM generate_series(1, 3) AS i
WHERE NOT EXISTS (SELECT 1 FROM card_keys WHERE content = 'CARD50-TEST-1' AND product_id = 'b0000000-0000-0000-0000-000000000001'::uuid);

INSERT INTO card_keys (id, product_id, content, status, created_at, updated_at)
SELECT gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002'::uuid, 'CARD100-TEST-' || i, 'AVAILABLE', NOW(), NOW()
FROM generate_series(1, 3) AS i
WHERE NOT EXISTS (SELECT 1 FROM card_keys WHERE content = 'CARD100-TEST-1' AND product_id = 'b0000000-0000-0000-0000-000000000002'::uuid);

INSERT INTO card_keys (id, product_id, content, status, created_at, updated_at)
SELECT gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003'::uuid, 'LICENSE-PRO-TEST-' || i, 'AVAILABLE', NOW(), NOW()
FROM generate_series(1, 3) AS i
WHERE NOT EXISTS (SELECT 1 FROM card_keys WHERE content = 'LICENSE-PRO-TEST-1' AND product_id = 'b0000000-0000-0000-0000-000000000003'::uuid);

INSERT INTO card_keys (id, product_id, content, status, created_at, updated_at)
SELECT gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004'::uuid, 'OFFICE-SUITE-TEST-' || i, 'AVAILABLE', NOW(), NOW()
FROM generate_series(1, 3) AS i
WHERE NOT EXISTS (SELECT 1 FROM card_keys WHERE content = 'OFFICE-SUITE-TEST-1' AND product_id = 'b0000000-0000-0000-0000-000000000004'::uuid);

INSERT INTO card_keys (id, product_id, content, status, created_at, updated_at)
SELECT gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005'::uuid, 'VIDEO-MEMBER-TEST-' || i, 'AVAILABLE', NOW(), NOW()
FROM generate_series(1, 3) AS i
WHERE NOT EXISTS (SELECT 1 FROM card_keys WHERE content = 'VIDEO-MEMBER-TEST-1' AND product_id = 'b0000000-0000-0000-0000-000000000005'::uuid);

INSERT INTO card_keys (id, product_id, content, status, created_at, updated_at)
SELECT gen_random_uuid(), 'b0000000-0000-0000-0000-000000000006'::uuid, 'MUSIC-MEMBER-TEST-' || i, 'AVAILABLE', NOW(), NOW()
FROM generate_series(1, 3) AS i
WHERE NOT EXISTS (SELECT 1 FROM card_keys WHERE content = 'MUSIC-MEMBER-TEST-1' AND product_id = 'b0000000-0000-0000-0000-000000000006'::uuid);

commit;
