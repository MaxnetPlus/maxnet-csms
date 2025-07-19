<?php

use App\Models\Customer;
use App\Models\Maintenance;
use App\Models\Subscription;
use Illuminate\Database\Seeder;

class MaintenanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customer = Customer::first();
        $subscription = Subscription::first();

        if (!$customer) {
            $this->command->warn('No customers found. Please create customers first.');
            return;
        }

        $maintenanceData = [
            [
                'ticket_id' => 'T001',
                'customer_id' => $customer->customer_id,
                'subscription_id' => $subscription ? $subscription->subscription_id : null,
                'subject_problem' => 'Internet connection issue',
                'customer_report' => 'Customer reports slow internet connection',
                'technician_update_desc' => 'Technician is investigating the issue',
                'status' => 'Open',
                'created_by' => 'admin',
                'work_by' => 'technician1',
            ],
            [
                'ticket_id' => 'T002',
                'customer_id' => $customer->customer_id,
                'subscription_id' => null,
                'subject_problem' => 'WiFi not working',
                'customer_report' => 'WiFi router needs replacement',
                'technician_update_desc' => 'Scheduled router replacement',
                'status' => 'In Progress',
                'created_by' => 'admin',
                'work_by' => 'technician2',
            ],
            [
                'ticket_id' => 'T003',
                'customer_id' => $customer->customer_id,
                'subscription_id' => $subscription ? $subscription->subscription_id : null,
                'subject_problem' => 'Billing inquiry',
                'customer_report' => 'Customer asking about billing details',
                'technician_update_desc' => 'Resolved billing inquiry',
                'status' => 'Closed',
                'created_by' => 'admin',
                'work_by' => 'sales_team',
                'ticket_close_date' => now(),
            ],
        ];

        foreach ($maintenanceData as $data) {
            Maintenance::create($data);
        }

        $this->command->info('Sample maintenance data created successfully!');
    }
}
