INSERT INTO platform_content (content_key, content_type, title_ar, title_en, body_ar, body_en, is_active)
VALUES ('demo_credentials_visible', 'setting', 'إظهار البيانات التجريبية', 'Show Demo Credentials', 'true', 'true', true)
ON CONFLICT DO NOTHING;