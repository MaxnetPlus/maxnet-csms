<?php

namespace App\Console\Commands;

use App\Models\SalesPoint;
use App\Models\Prospect;
use Illuminate\Console\Command;

class ShowDummyProspectsStats extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'prospects:show-stats {--recent=10 : Number of recent records to show}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Show statistics and recent records for prospects and points';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $recent = (int) $this->option('recent');

        $this->info('📊 Prospects & Points Statistics');
        $this->newLine();

        // Overall stats
        $totalProspects = Prospect::count();
        $totalPoints = SalesPoint::count();
        $todayProspects = Prospect::whereDate('created_at', today())->count();
        $todayPoints = SalesPoint::where('date', today())->count();

        $this->table(
            ['Metric', 'Total', 'Today'],
            [
                ['Prospects', $totalProspects, $todayProspects],
                ['Sales Points', $totalPoints, $todayPoints],
            ]
        );

        $this->newLine();

        // Recent prospects
        $this->info("📋 Recent {$recent} Prospects:");
        $recentProspects = Prospect::with('category')
            ->latest()
            ->take($recent)
            ->get();

        if ($recentProspects->isNotEmpty()) {
            $prospectData = $recentProspects->map(function ($prospect) {
                return [
                    $prospect->customer_name,
                    $prospect->category->name ?? 'N/A',
                    $prospect->status,
                    $prospect->created_at->format('Y-m-d H:i'),
                ];
            })->toArray();

            $this->table(
                ['Customer Name', 'Category', 'Status', 'Created At'],
                $prospectData
            );
        } else {
            $this->warn('No prospects found.');
        }

        $this->newLine();

        // Recent points
        $this->info("🎯 Recent {$recent} Sales Points:");
        $recentPoints = SalesPoint::with(['prospect'])
            ->latest()
            ->take($recent)
            ->get();

        if ($recentPoints->isNotEmpty()) {
            $pointsData = $recentPoints->map(function ($point) {
                return [
                    $point->prospect->customer_name ?? 'N/A',
                    $point->points_earned,
                    $point->type,
                    $point->date,
                    $point->description,
                ];
            })->toArray();

            $this->table(
                ['Customer', 'Points', 'Type', 'Date', 'Description'],
                $pointsData
            );
        } else {
            $this->warn('No sales points found.');
        }

        // Points summary by sales user
        $this->newLine();
        $this->info('👥 Points Summary by Sales User:');

        $pointsSummary = SalesPoint::selectRaw('sales_id, SUM(points_earned) as total_points, COUNT(*) as total_records')
            ->with('sales:id,name')
            ->groupBy('sales_id')
            ->get();

        if ($pointsSummary->isNotEmpty()) {
            $summaryData = $pointsSummary->map(function ($summary) {
                return [
                    $summary->sales->name ?? "User #{$summary->sales_id}",
                    $summary->total_points,
                    $summary->total_records,
                    number_format($summary->total_points / $summary->total_records, 2),
                ];
            })->toArray();

            $this->table(
                ['Sales User', 'Total Points', 'Total Records', 'Avg Points/Record'],
                $summaryData
            );
        }

        return Command::SUCCESS;
    }
}
