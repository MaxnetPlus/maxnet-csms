<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SalesTarget;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SalesTestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sales test user
        $salesUser = User::firstOrCreate(
            ['email' => 'sales@test.com'],
            [
                'name' => 'Sales User',
                'username' => 'sales',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
                'is_approved' => true,
            ]
        );

        // Assign sales role
        $salesUser->assignRole('sales');

        // Create default sales target
        SalesTarget::firstOrCreate(
            [
                'sales_id' => $salesUser->id,
                'effective_from' => now()->startOfMonth(),
            ],
            [
                'daily_target' => 10,
                'monthly_target' => 300,
                'effective_to' => null,
                'is_active' => true,
            ]
        );

        $this->command->info('👉 Sales test user created: ' . $salesUser->email);
        $this->command->info('👉 Password: password123');
        $this->command->info('👉 Sales target set: 10 points/day, 300 points/month');
    }
}
