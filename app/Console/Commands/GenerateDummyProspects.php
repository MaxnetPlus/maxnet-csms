<?php

namespace App\Console\Commands;

use App\Models\Prospect;
use App\Models\ProspectCategory;
use App\Models\SalesPoint;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateDummyProspects extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'prospects:generate-dummy 
                            {count=10 : Number of prospects to generate}
                            {--sales-id= : Specific sales user ID (optional)}
                            {--category-id= : Specific category ID (optional)}
                            {--status= : Specific status (new, contacted, qualified, converted, rejected)}
                            {--days-back=7 : How many days back to randomize creation dates}
                            {--today-only : Generate all prospects for today only}
                            {--yesterday-only : Generate all prospects for yesterday only}
                            {--point-type=daily : Type of points to award (daily, bonus, penalty)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate dummy prospects for testing with various options';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = (int) $this->argument('count');
        $specificSalesId = $this->option('sales-id');
        $specificCategoryId = $this->option('category-id');
        $specificStatus = $this->option('status');
        $daysBack = (int) $this->option('days-back');
        $todayOnly = $this->option('today-only');
        $yesterdayOnly = $this->option('yesterday-only');
        $pointType = $this->option('point-type');

        // Validate point type
        $validPointTypes = ['daily', 'bonus', 'penalty'];
        if (!in_array($pointType, $validPointTypes)) {
            $this->error("Invalid point type '{$pointType}'. Valid types are: " . implode(', ', $validPointTypes));
            return Command::FAILURE;
        }

        // Validate date options (only one can be used)
        if ($todayOnly && $yesterdayOnly) {
            $this->error('Cannot use both --today-only and --yesterday-only options together.');
            return Command::FAILURE;
        }

        // Check if we have sales users and categories
        if ($specificSalesId) {
            $salesUsers = User::where('id', $specificSalesId)
                ->whereHas('roles', function ($query) {
                    $query->where('name', 'sales');
                })->pluck('id')->toArray();
        } else {
            $salesUsers = User::whereHas('roles', function ($query) {
                $query->where('name', 'sales');
            })->pluck('id')->toArray();
        }

        if ($specificCategoryId) {
            $categories = ProspectCategory::where('id', $specificCategoryId)
                ->where('is_active', true)->pluck('id')->toArray();
        } else {
            $categories = ProspectCategory::where('is_active', true)->pluck('id')->toArray();
        }

        if (empty($salesUsers)) {
            $this->error($specificSalesId ? "Sales user with ID {$specificSalesId} not found or not a sales user." : 'No sales users found. Please create sales users first.');
            return Command::FAILURE;
        }

        if (empty($categories)) {
            $this->error($specificCategoryId ? "Category with ID {$specificCategoryId} not found or not active." : 'No active prospect categories found. Please create prospect categories first.');
            return Command::FAILURE;
        }

        // Validate status if provided
        $validStatuses = ['new', 'contacted', 'qualified', 'converted', 'rejected'];
        if ($specificStatus && !in_array($specificStatus, $validStatuses)) {
            $this->error("Invalid status '{$specificStatus}'. Valid statuses are: " . implode(', ', $validStatuses));
            return Command::FAILURE;
        }

        $this->info("Generating {$count} dummy prospects...");
        if ($specificSalesId) $this->line("→ Sales ID: {$specificSalesId}");
        if ($specificCategoryId) $this->line("→ Category ID: {$specificCategoryId}");
        if ($specificStatus) $this->line("→ Status: {$specificStatus}");
        if ($todayOnly) $this->line("→ Date: Today only");
        else if ($yesterdayOnly) $this->line("→ Date: Yesterday only");
        else $this->line("→ Date range: Last {$daysBack} days");
        $this->line("→ Point Type: {$pointType}");

        $statuses = $specificStatus ? [$specificStatus] : $validStatuses;
        $phoneFormats = ['08', '021', '0274', '0361', '0411'];

        // Sample data
        $firstNames = [
            'Ahmad', 'Budi', 'Sari', 'Dewi', 'Eko', 'Fitri', 'Gunawan', 'Hani', 'Indra', 'Joko',
            'Kartika', 'Lina', 'Maya', 'Nanda', 'Oki', 'Putri', 'Qori', 'Rizki', 'Sinta', 'Toni',
            'Umi', 'Vina', 'Wati', 'Xenia', 'Yudi', 'Zara'
        ];

        $lastNames = [
            'Pratama', 'Sari', 'Wijaya', 'Permata', 'Kusuma', 'Lestari', 'Santoso', 'Maharani',
            'Putra', 'Dewi', 'Handoko', 'Anggraini', 'Setiawan', 'Rahayu', 'Hidayat', 'Safitri',
            'Gunawan', 'Pertiwi', 'Nugroho', 'Puspita'
        ];

        $cities = [
            'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Palembang', 'Makassar',
            'Tangerang', 'Depok', 'Bogor', 'Bekasi', 'Yogyakarta', 'Malang', 'Solo', 'Denpasar'
        ];

        $streets = [
            'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani', 'Jl. Diponegoro',
            'Jl. Imam Bonjol', 'Jl. Merdeka', 'Jl. Pahlawan', 'Jl. Veteran', 'Jl. Pemuda',
            'Jl. Kartini', 'Jl. Gajah Mada', 'Jl. Hayam Wuruk', 'Jl. Majapahit', 'Jl. Sriwijaya'
        ];
        $prospects = [];
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 0; $i < $count; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $customerName = $firstName . ' ' . $lastName;

            $city = $cities[array_rand($cities)];
            $street = $streets[array_rand($streets)];
            $streetNumber = rand(1, 999);

            // Generate phone number
            $phonePrefix = $phoneFormats[array_rand($phoneFormats)];
            $phoneNumber = $phonePrefix . rand(10000000, 99999999);

            // Generate email
            $emailPrefix = strtolower(str_replace(' ', '.', $firstName . '.' . $lastName));
            $emailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.co.id'];
            $email = $emailPrefix . rand(1, 99) . '@' . $emailDomains[array_rand($emailDomains)];

            // Random coordinates around Indonesia
            $latitude = rand(-11000000, 6000000) / 1000000; // Indonesia latitude range approximately
            $longitude = rand(95000000, 141000000) / 1000000; // Indonesia longitude range approximately

            $status = $statuses[array_rand($statuses)];
            $convertedAt = null;
            if ($status === 'converted') {
                $convertedAt = now()->subDays(rand(0, 30));
            }


            // Determine creation date with random time
            if ($todayOnly) {
                $randomHour = rand(8, 18);
                $randomMinute = rand(0, 59);
                $createdAt = now()->setTime($randomHour, $randomMinute, 0);
            } else if ($yesterdayOnly) {
                $randomHour = rand(8, 18);
                $randomMinute = rand(0, 59);
                $createdAt = now()->subDay()->setTime($randomHour, $randomMinute, 0);
            } else {
                $randomDays = rand(0, $daysBack);
                $randomHour = rand(8, 18);
                $randomMinute = rand(0, 59);
                $createdAt = now()->subDays($randomDays)->setTime($randomHour, $randomMinute, 0);
            }
            $updatedAt = $createdAt;

            $salesId = $salesUsers[array_rand($salesUsers)];
            $categoryId = $categories[array_rand($categories)];

            // Create the prospect using Eloquent model to trigger model events and relationships

            $prospect = Prospect::create([
                'sales_id' => $salesId,
                'prospect_category_id' => $categoryId,
                'customer_name' => $customerName,
                'customer_email' => $email,
                'customer_number' => $phoneNumber,
                'address' => $street . ' No. ' . $streetNumber . ', ' . $city,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'status' => $status,
                'notes' => 'Prospek dummy yang dibuat untuk testing. Customer ini tertarik dengan layanan kami.',
                'converted_at' => $convertedAt,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);

            // Award points to sales (following the same logic as ProspectController@store)
            $this->awardPoints($prospect, $createdAt, $pointType);

            // Award bonus points for conversion if status is converted
            if ($status === 'converted') {
                $this->awardBonusPoints($prospect, $convertedAt ?: $createdAt, $pointType);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("Successfully generated {$count} dummy prospects with points awarded!");

        // Show some statistics
        $dateRange = $todayOnly ? 'Today only' : ($yesterdayOnly ? 'Yesterday only' : "Last {$daysBack} days to today");
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Prospects Created', $count],
                ['Sales Users Available', count($salesUsers)],
                ['Active Categories Available', count($categories)],
                ['Date Range', $dateRange],
                ['Status Filter', $specificStatus ?: 'All statuses'],
                ['Point Type', $pointType],
                ['Points System', 'Enabled (prospects + conversions)'],
            ]
        );

        return Command::SUCCESS;
    }

    /**
     * Award points to sales for new prospect (following ProspectController logic)
     */
    private function awardPoints(Prospect $prospect, $createdAt, $pointType = 'daily')
    {
        $category = $prospect->category;
        $points = $category ? $category->points : 1;

        SalesPoint::create([
            'sales_id' => $prospect->sales_id,
            'prospect_id' => $prospect->id,
            'points_earned' => $points,
            'date' => $createdAt->toDateString(),
            'type' => $pointType,
            'description' => "Poin dari prospek: {$prospect->customer_name} (Kategori: {$category->name}) - Type: {$pointType}",
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        $this->updateAccumulation($prospect->sales_id);
    }

    /**
     * Award bonus points for conversion
     */
    private function awardBonusPoints(Prospect $prospect, $convertedAt, $pointType = 'bonus')
    {
        $bonusPoints = 2; // Bonus points for conversion

        SalesPoint::create([
            'sales_id' => $prospect->sales_id,
            'prospect_id' => $prospect->id,
            'points_earned' => $bonusPoints,
            'date' => $convertedAt->toDateString(),
            'type' => $pointType === 'penalty' ? 'penalty' : 'bonus', // Keep bonus logic for conversions unless explicitly penalty
            'description' => "Bonus konversi prospek: {$prospect->customer_name} - Type: " . ($pointType === 'penalty' ? 'penalty' : 'bonus'),
            'created_at' => $convertedAt,
            'updated_at' => $convertedAt,
        ]);

        $this->updateAccumulation($prospect->sales_id);
    }

    /**
     * Update accumulated points for sales
     */
    private function updateAccumulation($salesId)
    {
        $totalPoints = SalesPoint::where('sales_id', $salesId)->sum('points_earned');

        // Update the latest record with current accumulation
        $latestPoint = SalesPoint::where('sales_id', $salesId)->latest()->first();
        if ($latestPoint) {
            $latestPoint->update(['accumulated_points' => $totalPoints]);
        }
    }
}
