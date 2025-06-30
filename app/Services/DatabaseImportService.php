<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Customer;
use App\Models\Subscription;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DatabaseImportService
{
    private const CHUNK_SIZE = 1000;

    public function importFromSql(UploadedFile $file): array
    {
        $progressId = Str::uuid()->toString();

        // Initialize progress
        $this->updateProgress($progressId, 0, 'Starting import...');

        try {
            // Read and parse SQL file
            $this->updateProgress($progressId, 10, 'Reading SQL file...');
            $sqlContent = file_get_contents($file->getPathname());

            if (!$sqlContent) {
                throw new \Exception('Failed to read SQL file');
            }

            // Parse customers data
            $this->updateProgress($progressId, 20, 'Parsing customers data...');
            $customersData = $this->parseCustomersFromSql($sqlContent);

            // Parse subscriptions data
            $this->updateProgress($progressId, 30, 'Parsing subscriptions data...');
            $subscriptionsData = $this->parseSubscriptionsFromSql($sqlContent);

            // Import customers first
            $this->updateProgress($progressId, 40, 'Importing customers...');
            $customerResults = $this->importCustomers($customersData, $progressId);

            // Import subscriptions
            $this->updateProgress($progressId, 70, 'Importing subscriptions...');
            $subscriptionResults = $this->importSubscriptions($subscriptionsData, $progressId);

            $this->updateProgress($progressId, 100, 'Import completed successfully!');

            return [
                'progress_id' => $progressId,
                'customers' => $customerResults,
                'subscriptions' => $subscriptionResults,
            ];
        } catch (\Exception $e) {
            $this->updateProgress($progressId, -1, 'Import failed: ' . $e->getMessage());
            Log::error('Database import failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    private function parseCustomersFromSql(string $sqlContent): array
    {
        $customers = [];

        // Extract INSERT statements for customers table
        $pattern = '/INSERT INTO\s+`?customers`?\s*\([^)]+\)\s*VALUES\s*(.+?);/is';
        preg_match_all($pattern, $sqlContent, $matches);

        Log::info('Found customer INSERT matches', ['count' => count($matches[1])]);

        foreach ($matches[1] as $valuesString) {
            // Parse values from SQL INSERT
            $valuesList = $this->parseInsertValues($valuesString);
            Log::info('Parsed values for customers', ['count' => count($valuesList)]);

            foreach ($valuesList as $values) {
                Log::info('Customer values', ['values' => $values, 'count' => count($values)]);
                
                if (count($values) >= 10) { // Ensure we have enough columns
                    $customerData = [
                        'customer_id' => $this->cleanValue($values[0]),
                        'customer_password' => $this->cleanValue($values[1]),
                        'customer_name' => $this->cleanValue($values[2]),
                        'referral_source' => $this->cleanValue($values[3]),
                        'customer_email' => $this->cleanValue($values[4]),
                        'customer_address' => $this->cleanValue($values[5]),
                        'customer_phone' => $this->cleanValue($values[6]),
                        'customer_ktp_no' => $this->cleanValue($values[7]),
                        'customer_ktp_picture' => $this->cleanValue($values[8]),
                        'password_reset' => $this->cleanValue($values[9]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    $customers[] = $customerData;
                    Log::info('Added customer', ['customer_data' => $customerData]);
                } else {
                    Log::warning('Skipped customer with insufficient values', ['values_count' => count($values)]);
                }
            }
        }

        Log::info('Total customers parsed', ['count' => count($customers)]);
        return $customers;
    }

    private function parseSubscriptionsFromSql(string $sqlContent): array
    {
        $subscriptions = [];

        // Extract INSERT statements for subscriptions table
        $pattern = '/INSERT INTO\s+`?subscriptions`?\s*\([^)]+\)\s*VALUES\s*(.+?);/is';
        preg_match_all($pattern, $sqlContent, $matches);

        foreach ($matches[1] as $valuesString) {
            // Parse values from SQL INSERT
            $valuesList = $this->parseInsertValues($valuesString);

            foreach ($valuesList as $values) {
                if (count($values) >= 25) { // Ensure we have enough columns
                    $subscriptions[] = [
                        'subscription_id' => $this->cleanValue($values[0]),
                        'subscription_password' => $this->cleanValue($values[1]),
                        'customer_id' => $this->cleanValue($values[2]),
                        'serv_id' => $this->cleanValue($values[3]),
                        'group' => $this->cleanValue($values[4]),
                        'created_by' => $this->cleanValue($values[5]),
                        'subscription_start_date' => $this->cleanValue($values[6]),
                        'subscription_billing_cycle' => $this->cleanValue($values[7]),
                        'subscription_price' => $this->cleanValue($values[8]),
                        'subscription_address' => $this->cleanValue($values[9]),
                        'subscription_status' => $this->cleanValue($values[10]),
                        'subscription_maps' => $this->cleanValue($values[11]),
                        'subscription_home_photo' => $this->cleanValue($values[12]),
                        'subscription_form_scan' => $this->cleanValue($values[13]),
                        'subscription_description' => $this->cleanValue($values[14]),
                        'cpe_type' => $this->cleanValue($values[15]),
                        'cpe_serial' => $this->cleanValue($values[16]),
                        'cpe_picture' => $this->cleanValue($values[17]),
                        'cpe_site' => $this->cleanValue($values[18]),
                        'cpe_mac' => $this->cleanValue($values[19]),
                        'is_cpe_rent' => $this->parseBooleanValue($values[20]),
                        'dismantle_at' => $this->parseNullableDate($values[21]),
                        'suspend_at' => $this->parseNullableDate($values[22]),
                        'installed_by' => $this->cleanValue($values[23]),
                        'subscription_test_result' => $this->cleanValue($values[24]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        return $subscriptions;
    }

    private function parseInsertValues(string $valuesString): array
    {
        Log::info('Parsing INSERT values', ['values_string' => $valuesString]);
        
        $result = [];
        $rows = explode('),(', trim($valuesString, '()'));
        
        Log::info('Split into rows', ['row_count' => count($rows), 'rows' => $rows]);

        foreach ($rows as $index => $row) {
            $values = str_getcsv($row, ',', "'");
            Log::info('Parsed row', ['index' => $index, 'values' => $values, 'count' => count($values)]);
            $result[] = $values;
        }

        Log::info('Final parsing result', ['total_rows' => count($result)]);
        return $result;
    }

    private function cleanValue(?string $value): ?string
    {
        if ($value === null || $value === 'NULL' || $value === '') {
            return null;
        }

        return trim($value, "'\"");
    }

    private function parseBooleanValue(?string $value): bool
    {
        $cleaned = $this->cleanValue($value);
        return in_array($cleaned, ['1', 'true', 'TRUE', true], true);
    }

    private function parseNullableDate(?string $value): ?\DateTime
    {
        $cleaned = $this->cleanValue($value);
        if ($cleaned === null) {
            return null;
        }

        try {
            return new \DateTime($cleaned);
        } catch (\Exception $e) {
            return null;
        }
    }

    private function importCustomers(array $customersData, string $progressId): array
    {
        Log::info('Starting customer import', ['data_count' => count($customersData)]);
        
        $chunks = array_chunk($customersData, self::CHUNK_SIZE);
        $totalChunks = count($chunks);
        $imported = 0;
        $skipped = 0;

        foreach ($chunks as $index => $chunk) {
            try {
                Log::info('Importing customer chunk', ['chunk_index' => $index, 'chunk_size' => count($chunk)]);
                
                // Use upsert to handle duplicates
                $result = Customer::upsert($chunk, ['customer_id'], [
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

                Log::info('Customer upsert result', ['result' => $result, 'chunk_size' => count($chunk)]);

                $imported += count($chunk);

                // Update progress
                $progress = 40 + (($index + 1) / $totalChunks) * 25; // 40% to 65%
                $this->updateProgress($progressId, (int)$progress, "Imported {$imported} customers...");
            } catch (\Exception $e) {
                $skipped += count($chunk);
                Log::warning('Failed to import customer chunk', [
                    'chunk_index' => $index,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        $result = [
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($customersData),
        ];
        
        Log::info('Customer import completed', $result);
        return $result;
    }

    private function importSubscriptions(array $subscriptionsData, string $progressId): array
    {
        $chunks = array_chunk($subscriptionsData, self::CHUNK_SIZE);
        $totalChunks = count($chunks);
        $imported = 0;
        $skipped = 0;

        foreach ($chunks as $index => $chunk) {
            try {
                // Filter out subscriptions with invalid customer_id
                $validChunk = array_filter($chunk, function ($subscription) {
                    return Customer::where('customer_id', $subscription['customer_id'])->exists();
                });

                if (!empty($validChunk)) {
                    Subscription::upsert($validChunk, ['subscription_id'], [
                        'subscription_password',
                        'customer_id',
                        'serv_id',
                        'group',
                        'created_by',
                        'subscription_start_date',
                        'subscription_billing_cycle',
                        'subscription_price',
                        'subscription_address',
                        'subscription_status',
                        'subscription_maps',
                        'subscription_home_photo',
                        'subscription_form_scan',
                        'subscription_description',
                        'cpe_type',
                        'cpe_serial',
                        'cpe_picture',
                        'cpe_site',
                        'cpe_mac',
                        'is_cpe_rent',
                        'dismantle_at',
                        'suspend_at',
                        'installed_by',
                        'subscription_test_result',
                        'updated_at'
                    ]);

                    $imported += count($validChunk);
                }

                $skipped += count($chunk) - count($validChunk);

                // Update progress
                $progress = 70 + (($index + 1) / $totalChunks) * 25; // 70% to 95%
                $this->updateProgress($progressId, (int)$progress, "Imported {$imported} subscriptions...");
            } catch (\Exception $e) {
                $skipped += count($chunk);
                Log::warning('Failed to import subscription chunk', [
                    'chunk_index' => $index,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($subscriptionsData),
        ];
    }

    private function updateProgress(string $progressId, int $percentage, string $message): void
    {
        Cache::put("import_progress_{$progressId}", [
            'percentage' => $percentage,
            'message' => $message,
            'updated_at' => now()->toISOString(),
        ], 3600); // Cache for 1 hour
    }

    public function getProgress(string $progressId): array
    {
        return Cache::get("import_progress_{$progressId}", [
            'percentage' => 0,
            'message' => 'Not started',
            'updated_at' => now()->toISOString(),
        ]);
    }
}
