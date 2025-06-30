<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Customer;
use App\Models\Subscription;

echo "Current database state:\n";
echo "Customers count: " . Customer::count() . "\n";
echo "Subscriptions count: " . Subscription::count() . "\n";

// Test creating a customer manually
echo "\nTesting manual customer creation...\n";
try {
    $customer = Customer::create([
        'customer_id' => 'TEST123',
        'customer_password' => 'test123',
        'customer_name' => 'Test Customer',
        'referral_source' => 'Test',
        'customer_email' => 'test@test.com',
        'customer_address' => 'Test Address',
        'customer_phone' => '1234567890',
        'customer_ktp_no' => '1234567890',
        'customer_ktp_picture' => null,
        'password_reset' => 0,
    ]);
    echo "Customer created successfully: " . $customer->customer_id . "\n";
} catch (Exception $e) {
    echo "Failed to create customer: " . $e->getMessage() . "\n";
}

echo "\nAfter manual creation:\n";
echo "Customers count: " . Customer::count() . "\n";

// Test upsert
echo "\nTesting upsert...\n";
try {
    $result = Customer::upsert([
        [
            'customer_id' => 'UPSERT123',
            'customer_password' => 'upsert123',
            'customer_name' => 'Upsert Customer',
            'referral_source' => 'Upsert',
            'customer_email' => 'upsert@test.com',
            'customer_address' => 'Upsert Address',
            'customer_phone' => '0987654321',
            'customer_ktp_no' => '0987654321',
            'customer_ktp_picture' => null,
            'password_reset' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]
    ], ['customer_id'], [
        'customer_password',
        'customer_name',
        'referral_source',
        'customer_email',
        'customer_address',
        'customer_phone',
        'customer_ktp_no',
        'customer_ktp_picture',
        'password_reset',
        'updated_at'
    ]);
    echo "Upsert result: " . var_export($result, true) . "\n";
} catch (Exception $e) {
    echo "Failed to upsert customer: " . $e->getMessage() . "\n";
}

echo "\nAfter upsert:\n";
echo "Customers count: " . Customer::count() . "\n";

// Show all customers
echo "\nAll customers:\n";
foreach (Customer::all() as $customer) {
    echo "- {$customer->customer_id}: {$customer->customer_name}\n";
}
