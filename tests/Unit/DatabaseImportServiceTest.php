<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Customer;
use App\Models\Subscription;
use App\Services\DatabaseImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class DatabaseImportServiceTest extends TestCase
{
    use RefreshDatabase;

    private DatabaseImportService $importService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->importService = new DatabaseImportService();
    }

    public function test_parse_customers_from_sql_handles_valid_data(): void
    {
        $sqlContent = "
INSERT INTO `customers` (`customer_id`, `customer_password`, `customer_name`, `referral_source`, `customer_email`, `customer_address`, `customer_phone`, `customer_ktp_no`, `customer_ktp_picture`, `password_reset`) VALUES
('CUST001', 'password123', 'John Doe', 'web', 'john@example.com', '123 Main St', '08123456789', '1234567890123456', 'ktp.jpg', '0'),
('CUST002', 'password456', 'Jane Smith', 'referral', 'jane@example.com', '456 Oak Ave', '08987654321', '6543210987654321', 'ktp2.jpg', '0');
        ";

        $reflection = new \ReflectionClass($this->importService);
        $method = $reflection->getMethod('parseCustomersFromSql');
        $method->setAccessible(true);

        $customers = $method->invoke($this->importService, $sqlContent);

        $this->assertCount(2, $customers);
        $this->assertEquals('CUST001', $customers[0]['customer_id']);
        $this->assertEquals('John Doe', $customers[0]['customer_name']);
        $this->assertEquals('john@example.com', $customers[0]['customer_email']);

        $this->assertEquals('CUST002', $customers[1]['customer_id']);
        $this->assertEquals('Jane Smith', $customers[1]['customer_name']);
        $this->assertEquals('jane@example.com', $customers[1]['customer_email']);
    }

    public function test_parse_subscriptions_from_sql_handles_all_34_columns(): void
    {
        $sqlContent = "
INSERT INTO `subscriptions` (`subscription_id`, `subscription_password`, `customer_id`, `serv_id`, `group`, `created_by`, `subscription_start_date`, `subscription_billing_cycle`, `subscription_price`, `subscription_address`, `subscription_status`, `subscription_maps`, `subscription_home_photo`, `subscription_form_scan`, `subscription_description`, `cpe_type`, `cpe_serial`, `cpe_picture`, `cpe_site`, `cpe_mac`, `is_cpe_rent`, `created_at`, `updated_at`, `dismantle_at`, `suspend_at`, `installed_by`, `subscription_test_result`, `odp_distance`, `approved_at`, `installed_at`, `index_month`, `attenuation_photo`, `ip_address`, `handle_by`) VALUES
('SUB001', 'subpass123', 'CUST001', 'SERV001', 'GROUP1', 'admin', '2024-01-01', 'monthly', '100000', '123 Main St', 'active', 'maps.jpg', 'home.jpg', 'form.pdf', 'Fiber connection', 'ONT', 'ONT123456', 'ont.jpg', 'SITE001', '00:11:22:33:44:55', '1', '2024-01-01 10:00:00', '2024-01-01 10:00:00', NULL, NULL, 'tech1', 'passed', '100m', '2024-01-01 11:00:00', '2024-01-01 12:00:00', '1', 'att.jpg', '192.168.1.100', 'admin');
        ";

        $reflection = new \ReflectionClass($this->importService);
        $method = $reflection->getMethod('parseSubscriptionsFromSql');
        $method->setAccessible(true);

        $subscriptions = $method->invoke($this->importService, $sqlContent);

        $this->assertCount(1, $subscriptions);

        $subscription = $subscriptions[0];

        // Test key fields
        $this->assertEquals('SUB001', $subscription['subscription_id']);
        $this->assertEquals('CUST001', $subscription['customer_id']);
        $this->assertEquals('SERV001', $subscription['serv_id']);
        $this->assertEquals('GROUP1', $subscription['group']);
        $this->assertEquals('admin', $subscription['created_by']);

        // Test boolean parsing
        $this->assertTrue($subscription['is_cpe_rent']);

        // Test integer parsing
        $this->assertEquals(1, $subscription['index_month']);

        // Test nullable fields
        $this->assertNull($subscription['dismantle_at']);
        $this->assertNull($subscription['suspend_at']);

        // Test that all 34 columns are present (excluding timestamps which may be auto-generated)
        $expectedKeys = [
            'subscription_id', 'subscription_password', 'customer_id', 'serv_id', 'group',
            'created_by', 'subscription_start_date', 'subscription_billing_cycle',
            'subscription_price', 'subscription_address', 'subscription_status',
            'subscription_maps', 'subscription_home_photo', 'subscription_form_scan',
            'subscription_description', 'cpe_type', 'cpe_serial', 'cpe_picture',
            'cpe_site', 'cpe_mac', 'is_cpe_rent', 'created_at', 'updated_at',
            'dismantle_at', 'suspend_at', 'installed_by', 'subscription_test_result',
            'odp_distance', 'approved_at', 'installed_at', 'index_month',
            'attenuation_photo', 'ip_address', 'handle_by'
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $subscription, "Missing key: {$key}");
        }
    }

    public function test_validation_rejects_invalid_subscription_data(): void
    {
        $reflection = new \ReflectionClass($this->importService);
        $method = $reflection->getMethod('validateSubscriptionData');
        $method->setAccessible(true);

        // Test missing required fields
        $invalidData = [
            'subscription_password' => 'password',
            'serv_id' => 'SERV001',
        ];

        $this->assertFalse($method->invoke($this->importService, $invalidData));

        // Test valid data
        $validData = [
            'subscription_id' => 'SUB001',
            'customer_id' => 'CUST001',
            'serv_id' => 'SERV001',
        ];

        $this->assertTrue($method->invoke($this->importService, $validData));
    }

    public function test_validation_rejects_invalid_customer_data(): void
    {
        $reflection = new \ReflectionClass($this->importService);
        $method = $reflection->getMethod('validateCustomerData');
        $method->setAccessible(true);

        // Test missing required fields
        $invalidData = [
            'customer_password' => 'password',
        ];

        $this->assertFalse($method->invoke($this->importService, $invalidData));

        // Test valid data
        $validData = [
            'customer_id' => 'CUST001',
            'customer_name' => 'John Doe',
        ];

        $this->assertTrue($method->invoke($this->importService, $validData));
    }

    public function test_clean_value_handles_sql_nulls_and_quotes(): void
    {
        $reflection = new \ReflectionClass($this->importService);
        $method = $reflection->getMethod('cleanValue');
        $method->setAccessible(true);

        $this->assertNull($method->invoke($this->importService, 'NULL'));
        $this->assertNull($method->invoke($this->importService, null));
        $this->assertNull($method->invoke($this->importService, ''));

        $this->assertEquals('test value', $method->invoke($this->importService, "'test value'"));
        $this->assertEquals('test value', $method->invoke($this->importService, '"test value"'));
        $this->assertEquals('test value', $method->invoke($this->importService, 'test value'));
    }

    public function test_parse_boolean_value_handles_various_formats(): void
    {
        $reflection = new \ReflectionClass($this->importService);
        $method = $reflection->getMethod('parseBooleanValue');
        $method->setAccessible(true);

        $this->assertTrue($method->invoke($this->importService, '1'));
        $this->assertTrue($method->invoke($this->importService, 'true'));
        $this->assertTrue($method->invoke($this->importService, 'TRUE'));
        $this->assertTrue($method->invoke($this->importService, 'yes'));
        $this->assertTrue($method->invoke($this->importService, 'on'));

        $this->assertFalse($method->invoke($this->importService, '0'));
        $this->assertFalse($method->invoke($this->importService, 'false'));
        $this->assertFalse($method->invoke($this->importService, 'no'));

        $this->assertNull($method->invoke($this->importService, 'NULL'));
        $this->assertNull($method->invoke($this->importService, null));
    }
}
