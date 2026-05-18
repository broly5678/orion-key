
UPDATE users SET email = 'admin@fk.jixianxiake.xyz' WHERE username = 'admin';
UPDATE site_configs SET config_value = 'FK Shop' WHERE config_key = 'site_name';
UPDATE site_configs SET config_value = '数字商品自动发货' WHERE config_key = 'site_slogan';
UPDATE site_configs SET config_value = '自助下单，自动交付，支持常见数字商品销售场景' WHERE config_key = 'site_description';
UPDATE site_configs SET config_value = 'FK Shop' WHERE config_key = 'footer_text';
UPDATE site_configs SET config_value = '' WHERE config_key IN ('github_url','contact_email','contact_telegram','contact_telegram_group','logo_url','favicon_url');
