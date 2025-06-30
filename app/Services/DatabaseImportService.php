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

        foreach ($matches[1] as $valuesString) {
            // Parse values from SQL INSERT
            $valuesList = $this->parseInsertValues($valuesString);

            foreach ($valuesList as $values) {
                if (count($values) >= 10) { // Ensure we have enough columns
                    try {
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

                        // Validate customer data before adding
                        if ($this->validateCustomerData($customerData)) {
                            $customers[] = $customerData;
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to parse customer row', [
                            'values_count' => count($values),
                            'first_few_values' => array_slice($values, 0, 5),
                            'error' => $e->getMessage(),
                        ]);
                    }
                } else {
                    Log::warning('Customer row has insufficient columns', [
                        'expected' => 10,
                        'actual' => count($values),
                        'first_few_values' => array_slice($values, 0, min(5, count($values))),
                    ]);
                }
            }
        }

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
                if (count($values) >= 34) { // Ensure we have all 34 columns
                    try {
                        $subscriptionData = [
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
                            'created_at' => $this->parseTimestamp($values[21]),
                            'updated_at' => $this->parseTimestamp($values[22]),
                            'dismantle_at' => $this->parseNullableDate($values[23]),
                            'suspend_at' => $this->parseNullableDate($values[24]),
                            'installed_by' => $this->cleanValue($values[25]),
                            'subscription_test_result' => $this->cleanValue($values[26]),
                            'odp_distance' => $this->cleanValue($values[27]),
                            'approved_at' => $this->parseTimestamp($values[28]),
                            'installed_at' => $this->parseNullableDate($values[29]),
                            'index_month' => $this->parseInteger($values[30]),
                            'attenuation_photo' => $this->cleanValue($values[31]),
                            'ip_address' => $this->cleanValue($values[32]),
                            'handle_by' => $this->cleanValue($values[33]),
                        ];

                        // Validate subscription data before adding
                        if ($this->validateSubscriptionData($subscriptionData)) {
                            $subscriptions[] = $subscriptionData;
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to parse subscription row', [
                            'values_count' => count($values),
                            'first_few_values' => array_slice($values, 0, 5),
                            'error' => $e->getMessage(),
                        ]);
                    }
                } else {
                    Log::warning('Subscription row has insufficient columns', [
                        'expected' => 34,
                        'actual' => count($values),
                        'first_few_values' => array_slice($values, 0, min(5, count($values))),
                    ]);
                }
            }
        }

        return $subscriptions;
    }

    private function parseInsertValues(string $valuesString): array
    {
        $result = [];

        // Remove leading/trailing whitespace and parentheses
        $valuesString = trim($valuesString);

        // Split by '),(' or '),\n(' or '),\r\n(' to handle different line endings
        $pattern = '/\),\s*\n?\s*\(/';
        $rows = preg_split($pattern, $valuesString);

        // Clean up the first and last rows (remove leading/trailing parentheses)
        if (!empty($rows)) {
            $rows[0] = ltrim($rows[0], '(');
            $rows[count($rows) - 1] = rtrim($rows[count($rows) - 1], ')');
        }

        foreach ($rows as $index => $row) {
            $row = trim($row);
            if (empty($row)) continue;

            // Use a more robust CSV parsing for SQL values
            $values = $this->parseSqlValues($row);
            $result[] = $values;
        }

        return $result;
    }

    private function parseSqlValues(string $row): array
    {
        $values = [];
        $current = '';
        $inQuotes = false;
        $quoteChar = '';
        $i = 0;

        while ($i < strlen($row)) {
            $char = $row[$i];

            if (!$inQuotes && ($char === "'" || $char === '"')) {
                $inQuotes = true;
                $quoteChar = $char;
                $current .= $char;
            } elseif ($inQuotes && $char === $quoteChar) {
                // Check if it's an escaped quote
                if ($i + 1 < strlen($row) && $row[$i + 1] === $quoteChar) {
                    $current .= $char . $char;
                    $i++; // Skip the next character
                } else {
                    $inQuotes = false;
                    $current .= $char;
                }
            } elseif (!$inQuotes && $char === ',') {
                $values[] = trim($current);
                $current = '';
            } else {
                $current .= $char;
            }

            $i++;
        }

        // Add the last value
        if ($current !== '') {
            $values[] = trim($current);
        }

        return $values;
    }

    private function cleanValue(?string $value): ?string
    {
        if ($value === null || $value === 'NULL' || $value === '') {
            return null;
        }

        return trim($value, "'\"");
    }

    private function parseBooleanValue(?string $value): ?bool
    {
        $cleaned = $this->cleanValue($value);
        if ($cleaned === null) {
            return null;
        }

        return in_array(strtolower($cleaned), ['1', 'true', 'yes', 'on'], true);
    }

    private function parseNullableDate(?string $value): ?string
    {
        $cleaned = $this->cleanValue($value);
        if ($cleaned === null) {
            return null;
        }

        try {
            $date = new \DateTime($cleaned);
            return $date->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function parseTimestamp(?string $value): ?string
    {
        $cleaned = $this->cleanValue($value);
        if ($cleaned === null) {
            return null;
        }

        try {
            $date = new \DateTime($cleaned);
            return $date->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function parseInteger(?string $value): int
    {
        $cleaned = $this->cleanValue($value);
        return (int) ($cleaned ?? 0);
    }

    private function importCustomers(array $customersData, string $progressId): array
    {
        $chunks = array_chunk($customersData, self::CHUNK_SIZE);
        $totalChunks = count($chunks);
        $imported = 0;
        $skipped = 0;

        foreach ($chunks as $index => $chunk) {
            try {
                // Use upsert to handle duplicates
                Customer::upsert($chunk, ['customer_id'], [
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

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($customersData),
        ];
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
                        'created_at',
                        'updated_at',
                        'dismantle_at',
                        'suspend_at',
                        'installed_by',
                        'subscription_test_result',
                        'odp_distance',
                        'approved_at',
                        'installed_at',
                        'index_month',
                        'attenuation_photo',
                        'ip_address',
                        'handle_by'
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

    private function validateSubscriptionData(array $subscriptionData): bool
    {
        // Required fields check
        $requiredFields = ['subscription_id', 'customer_id', 'serv_id'];

        foreach ($requiredFields as $field) {
            if (empty($subscriptionData[$field])) {
                Log::warning('Subscription validation failed: missing required field', [
                    'field' => $field,
                    'subscription_id' => $subscriptionData['subscription_id'] ?? 'unknown',
                ]);
                return false;
            }
        }

        // Validate subscription_id format (if there are specific format requirements)
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $subscriptionData['subscription_id'])) {
            Log::warning('Subscription validation failed: invalid subscription_id format', [
                'subscription_id' => $subscriptionData['subscription_id'],
            ]);
            return false;
        }

        return true;
    }

    private function validateCustomerData(array $customerData): bool
    {
        // Required fields check
        $requiredFields = ['customer_id', 'customer_name'];

        foreach ($requiredFields as $field) {
            if (empty($customerData[$field])) {
                Log::warning('Customer validation failed: missing required field', [
                    'field' => $field,
                    'customer_id' => $customerData['customer_id'] ?? 'unknown',
                ]);
                return false;
            }
        }

        // Validate customer_id format
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $customerData['customer_id'])) {
            Log::warning('Customer validation failed: invalid customer_id format', [
                'customer_id' => $customerData['customer_id'],
            ]);
            return false;
        }

        return true;
    }
}
