<?php

namespace App\Console\Commands;

use App\Models\Prospect;
use Illuminate\Console\Command;

class CleanDummyProspects extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'prospects:clean-dummy 
                            {--confirm : Skip confirmation prompt}
                            {--days=30 : Delete prospects older than this many days}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up dummy prospects (those with notes containing "testing")';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $skipConfirm = $this->option('confirm');

        // Find dummy prospects (those with "testing" in notes)
        $query = Prospect::where('notes', 'like', '%testing%')
            ->where('created_at', '<', now()->subDays($days));

        $count = $query->count();

        if ($count === 0) {
            $this->info('No dummy prospects found to clean up.');
            return Command::SUCCESS;
        }

        $this->info("Found {$count} dummy prospects older than {$days} days.");

        if (!$skipConfirm) {
            if (!$this->confirm('Do you want to delete these prospects?')) {
                $this->info('Operation cancelled.');
                return Command::SUCCESS;
            }
        }

        $deleted = $query->delete();

        $this->info("Successfully deleted {$deleted} dummy prospects!");

        return Command::SUCCESS;
    }
}
