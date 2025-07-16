<?php

use App\Models\User;
use App\Models\SalesTarget;

// Check sales users and their targets
echo "=== SALES MANAGEMENT DEBUG ===\n";

$salesUsers = User::role('sales')->with('salesTargets')->get();

echo "Total Sales Users: " . $salesUsers->count() . "\n\n";

foreach ($salesUsers as $user) {
    echo "Sales User: {$user->name} (ID: {$user->id})\n";
    echo "Email: {$user->email}\n";
    echo "Username: {$user->username}\n";
    echo "Sales Targets Count: " . $user->salesTargets->count() . "\n";

    if ($user->salesTargets->count() > 0) {
        foreach ($user->salesTargets as $target) {
            echo "  - Target ID: {$target->id}\n";
            echo "    Daily Target: {$target->daily_target}\n";
            echo "    Monthly Target: {$target->monthly_target}\n";
            echo "    Active: " . ($target->is_active ? 'Yes' : 'No') . "\n";
            echo "    Effective From: {$target->effective_from}\n";
            echo "    Effective To: " . ($target->effective_to ?: 'Not set') . "\n";
        }
    } else {
        echo "  No targets found!\n";
    }

    // Test getCurrentTarget method
    $currentTarget = $user->getCurrentTarget();
    echo "Current Target via method: " . ($currentTarget ? "Found (Daily: {$currentTarget->daily_target})" : "Not found") . "\n";

    echo "\n" . str_repeat("-", 50) . "\n\n";
}

echo "=== ALL SALES TARGETS ===\n";
$allTargets = SalesTarget::all();
foreach ($allTargets as $target) {
    echo "Target ID: {$target->id}, Sales ID: {$target->sales_id}, Active: " . ($target->is_active ? 'Yes' : 'No') . "\n";
}
