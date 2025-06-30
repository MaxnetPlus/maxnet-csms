-- Test SQL file for customers and subscriptions

INSERT INTO customers (customer_id, customer_password, customer_name, referral_source, customer_email, customer_address, customer_phone, customer_ktp_no, customer_ktp_picture, password_reset) VALUES
('CUST001', 'password123', 'John Doe', 'Website', 'john@example.com', '123 Main St', '1234567890', '1234567890', null, 0),
('CUST002', 'password456', 'Jane Smith', 'Referral', 'jane@example.com', '456 Oak Ave', '0987654321', '0987654321', null, 0);

INSERT INTO subscriptions (subscription_id, subscription_password, customer_id, serv_id, group, created_by, subscription_start_date, subscription_billing_cycle, subscription_price, subscription_address, subscription_status, subscription_maps, subscription_home_photo, subscription_form_scan, subscription_description, cpe_type, cpe_serial, cpe_picture, cpe_site, cpe_mac, is_cpe_rent, dismantle_at, suspend_at, installed_by, subscription_test_result) VALUES
('SUB001', 'subpass123', 'CUST001', 'SERV001', 'GROUP1', 'admin', '2024-01-01', 'monthly', 100000, '123 Main St', 'active', null, null, null, 'Test subscription 1', 'Router', 'SN123456', null, 'Site1', 'AA:BB:CC:DD:EE:FF', 1, null, null, 'tech1', 'passed'),
('SUB002', 'subpass456', 'CUST002', 'SERV002', 'GROUP1', 'admin', '2024-01-15', 'monthly', 150000, '456 Oak Ave', 'active', null, null, null, 'Test subscription 2', 'Modem', 'SN789012', null, 'Site2', 'FF:EE:DD:CC:BB:AA', 0, null, null, 'tech2', 'passed');
