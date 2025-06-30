<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $service = new \App\Services\DatabaseImportService();
    echo "DatabaseImportService instantiated successfully\n";

    // Test the method signatures exist
    $reflection = new ReflectionClass($service);

    $requiredMethods = [
        'parseTimestamp',
        'parseInteger',
        'validateSubscriptionData',
        'validateCustomerData',
        'parseBooleanValue',
        'parseNullableDate',
        'cleanValue'
    ];

    foreach ($requiredMethods as $method) {
        if ($reflection->hasMethod($method)) {
            echo "✓ Method {$method} exists\n";
        } else {
            echo "✗ Method {$method} missing\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
