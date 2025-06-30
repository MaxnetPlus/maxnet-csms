<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\DatabaseImportService;
use Illuminate\Http\UploadedFile;
use App\Models\Customer;
use App\Models\Subscription;

echo "Before import:\n";
echo "Customers: " . Customer::count() . "\n";
echo "Subscriptions: " . Subscription::count() . "\n\n";

// Create a mock UploadedFile from our test SQL
$testFile = new UploadedFile(
    'test_import.sql',  // path
    'test_import.sql',  // original name
    'text/plain',       // mime type
    null,               // error
    true                // test mode
);

$service = new DatabaseImportService();

try {
    echo "Starting import...\n";
    $result = $service->importFromSql($testFile);

    echo "Import completed!\n";
    echo "Progress ID: " . $result['progress_id'] . "\n";
    echo "Customers: " . json_encode($result['customers']) . "\n";
    echo "Subscriptions: " . json_encode($result['subscriptions']) . "\n";
} catch (Exception $e) {
    echo "Import failed: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\nAfter import:\n";
echo "Customers: " . Customer::count() . "\n";
echo "Subscriptions: " . Subscription::count() . "\n";

// Show all customers
echo "\nCustomer list:\n";
foreach (Customer::all() as $customer) {
    echo "- {$customer->customer_id}: {$customer->customer_name} ({$customer->customer_email})\n";
}

// Show all subscriptions
echo "\nSubscription list:\n";
foreach (Subscription::all() as $subscription) {
    echo "- {$subscription->subscription_id}: Customer {$subscription->customer_id} - {$subscription->subscription_status}\n";
}
