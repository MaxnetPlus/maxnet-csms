<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\SalesTarget;

class DebugSalesTargets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'debug:sales-targets';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Debug sales targets data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== SALES MANAGEMENT DEBUG ===');

        $salesUsers = User::role('sales')->with('salesTargets')->get();

        $this->info("Total Sales Users: " . $salesUsers->count());

        foreach ($salesUsers as $user) {
            $this->info("\nSales User: {$user->name} (ID: {$user->id})");
            $this->info("Email: {$user->email}");
            $this->info("Username: {$user->username}");
            $this->info("Sales Targets Count: " . $user->salesTargets->count());

            if ($user->salesTargets->count() > 0) {
                foreach ($user->salesTargets as $target) {
                    $this->info("  - Target ID: {$target->id}");
                    $this->info("    Daily Target: {$target->daily_target}");
                    $this->info("    Monthly Target: {$target->monthly_target}");
                    $this->info("    Active: " . ($target->is_active ? 'Yes' : 'No'));
                    $this->info("    Effective From: {$target->effective_from}");
                    $this->info("    Effective To: " . ($target->effective_to ?: 'Not set'));
                }
            } else {
                $this->warn("  No targets found!");
            }

            // Test getCurrentTarget method
            $currentTarget = $user->getCurrentTarget();
            $this->info("Current Target via method: " . ($currentTarget ? "Found (Daily: {$currentTarget->daily_target})" : "Not found"));

            $this->info(str_repeat("-", 50));
        }

        $this->info("\n=== ALL SALES TARGETS ===");
        $allTargets = SalesTarget::all();
        foreach ($allTargets as $target) {
            $this->info("Target ID: {$target->id}, Sales ID: {$target->sales_id}, Active: " . ($target->is_active ? 'Yes' : 'No'));
        }

        return Command::SUCCESS;
    }
}
