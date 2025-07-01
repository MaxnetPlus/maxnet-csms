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
    private const CHUNK_SIZE = 500; // Reduced from 1000 to avoid timeout/memory issues

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

        // Set memory limit for large files
        ini_set('memory_limit', '512M');

        Log::info('Starting customer parsing', [
            'content_size' => strlen($sqlContent)
        ]);

        // Use a different approach: split by lines and look for INSERT statements
        $lines = explode("\n", $sqlContent);
        $currentInsert = '';
        $inCustomerInsert = false;

        foreach ($lines as $lineNum => $line) {
            $line = trim($line);

            // Check if this line starts a customer INSERT
            if (preg_match('/^INSERT INTO\s+`?customers`?\s+VALUES/i', $line)) {
                $inCustomerInsert = true;
                $currentInsert = $line;
                Log::info("Found customer INSERT at line " . ($lineNum + 1));
            } elseif ($inCustomerInsert) {
                $currentInsert .= ' ' . $line;
            }

            // Check if INSERT statement is complete (ends with semicolon)
            if ($inCustomerInsert && substr(rtrim($line), -1) === ';') {
                $inCustomerInsert = false;

                // Extract VALUES part
                if (preg_match('/INSERT INTO\s+`?customers`?\s+VALUES\s*(.+);$/is', $currentInsert, $matches)) {
                    $valuesString = $matches[1];

                    // Parse values from SQL INSERT
                    $valuesList = $this->parseInsertValues($valuesString);

                    Log::info('Parsing customer values', [
                        'insert_length' => strlen($currentInsert),
                        'rows_found' => count($valuesList)
                    ]);

                    foreach ($valuesList as $values) {
                        if (count($values) >= 12) { // Customer records have 12 columns (including created_at, updated_at)
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
                                    'created_at' => $this->parseTimestamp($values[10]),
                                    'updated_at' => $this->parseTimestamp($values[11]),
                                ];

                                // Validate customer data before adding
                                if ($this->validateCustomerData($customerData)) {
                                    // Sanitize data to fit database constraints
                                    $customerData = $this->sanitizeDataForDatabase($customerData);
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
                                'expected' => 12,
                                'actual' => count($values),
                                'first_few_values' => array_slice($values, 0, min(5, count($values))),
                            ]);
                        }
                    }
                }

                $currentInsert = '';
            }
        }

        Log::info('Customer parsing completed', [
            'total_customers_parsed' => count($customers)
        ]);

        return $customers;
    }

    private function parseCustomersFromLargeSql(string $sqlContent): array
    {
        $customers = [];

        // For large files, use line-by-line processing to avoid memory issues
        $lines = explode("\n", $sqlContent);

        foreach ($lines as $line) {
            $line = trim($line);

            // Look for customer INSERT statements
            if (preg_match('/^INSERT INTO\s+`?customers`?\s+VALUES\s*(.+);$/i', $line, $matches)) {
                Log::info('Found large customer INSERT line', [
                    'line_length' => strlen($line)
                ]);

                $valuesString = $matches[1];
                $valuesList = $this->parseInsertValues($valuesString);

                foreach ($valuesList as $values) {
                    if (count($values) >= 12) { // Customer records have 12 columns
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
                                'created_at' => $this->parseTimestamp($values[10]),
                                'updated_at' => $this->parseTimestamp($values[11]),
                            ];

                            if ($this->validateCustomerData($customerData)) {
                                // Sanitize data to fit database constraints
                                $customerData = $this->sanitizeDataForDatabase($customerData);
                                $customers[] = $customerData;
                            }
                        } catch (\Exception $e) {
                            Log::warning('Failed to parse customer row in large file', [
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                }
            }
        }

        return $customers;
    }

    private function parseSubscriptionsFromSql(string $sqlContent): array
    {
        $subscriptions = [];

        // Set memory limit for large files
        ini_set('memory_limit', '512M');

        Log::info('Starting subscription parsing', [
            'content_size' => strlen($sqlContent)
        ]);

        // Use a different approach: split by lines and look for INSERT statements
        $lines = explode("\n", $sqlContent);
        $currentInsert = '';
        $inSubscriptionInsert = false;

        foreach ($lines as $lineNum => $line) {
            $line = trim($line);

            // Check if this line starts a subscription INSERT
            if (preg_match('/^INSERT INTO\s+`?subscriptions`?\s+VALUES/i', $line)) {
                $inSubscriptionInsert = true;
                $currentInsert = $line;
                Log::info("Found subscription INSERT at line " . ($lineNum + 1));
            } elseif ($inSubscriptionInsert) {
                $currentInsert .= ' ' . $line;
            }

            // Check if INSERT statement is complete (ends with semicolon)
            if ($inSubscriptionInsert && substr(rtrim($line), -1) === ';') {
                $inSubscriptionInsert = false;

                // Extract VALUES part
                if (preg_match('/INSERT INTO\s+`?subscriptions`?\s+VALUES\s*(.+);$/is', $currentInsert, $matches)) {
                    $valuesString = $matches[1];

                    // Parse values from SQL INSERT
                    $valuesList = $this->parseInsertValues($valuesString);

                    Log::info('Parsing subscription values', [
                        'insert_length' => strlen($currentInsert),
                        'rows_found' => count($valuesList)
                    ]);

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
                                    // Sanitize data to fit database constraints
                                    $subscriptionData = $this->sanitizeDataForDatabase($subscriptionData);
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

                $currentInsert = '';
            }
        }

        Log::info('Subscription parsing completed', [
            'total_subscriptions_parsed' => count($subscriptions)
        ]);

        return $subscriptions;
    }

    private function parseSubscriptionsFromLargeSql(string $sqlContent): array
    {
        $subscriptions = [];

        // For large files, use line-by-line processing to avoid memory issues
        $lines = explode("\n", $sqlContent);

        foreach ($lines as $line) {
            $line = trim($line);

            // Look for subscription INSERT statements
            if (preg_match('/^INSERT INTO\s+`?subscriptions`?\s+VALUES\s*(.+);$/i', $line, $matches)) {
                Log::info('Found large subscription INSERT line', [
                    'line_length' => strlen($line)
                ]);

                $valuesString = $matches[1];
                $valuesList = $this->parseInsertValues($valuesString);

                foreach ($valuesList as $values) {
                    if (count($values) >= 34) {
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

                            if ($this->validateSubscriptionData($subscriptionData)) {
                                // Sanitize data to fit database constraints
                                $subscriptionData = $this->sanitizeDataForDatabase($subscriptionData);
                                $subscriptions[] = $subscriptionData;
                            }
                        } catch (\Exception $e) {
                            Log::warning('Failed to parse subscription row in large file', [
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
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
                // Check if it's an escaped quote (either \' or '')
                if ($i > 0 && $row[$i - 1] === '\\') {
                    // Backslash-escaped quote, keep it as part of the string
                    $current .= $char;
                } elseif ($i + 1 < strlen($row) && $row[$i + 1] === $quoteChar) {
                    // Double-escaped quote (like '' or "")
                    $current .= $char . $char;
                    $i++; // Skip the next character
                } else {
                    // End of quoted string
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
        if ($cleaned === null || $cleaned === '0000-00-00 00:00:00' || $cleaned === '0000-00-00') {
            return null;
        }

        try {
            $date = new \DateTime($cleaned);
            return $date->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            Log::debug('Failed to parse date', [
                'value' => $cleaned,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    private function parseTimestamp(?string $value): ?string
    {
        $cleaned = $this->cleanValue($value);
        if ($cleaned === null || $cleaned === '0000-00-00 00:00:00' || $cleaned === '0000-00-00') {
            return null;
        }

        try {
            $date = new \DateTime($cleaned);
            return $date->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            Log::debug('Failed to parse timestamp', [
                'value' => $cleaned,
                'error' => $e->getMessage()
            ]);
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
        $skippedRecords = []; // Track skipped records with details

        foreach ($chunks as $index => $chunk) {
            try {
                // Validate chunk before import
                $validChunk = [];
                $invalidCount = 0;

                foreach ($chunk as $customer) {
                    if ($this->validateCustomerData($customer)) {
                        $validChunk[] = $customer;
                    } else {
                        $invalidCount++;
                        $skippedRecords[] = [
                            'customer_id' => $customer['customer_id'] ?? 'unknown',
                            'customer_name' => $customer['customer_name'] ?? 'unknown',
                            'reason' => 'Validation failed',
                            'details' => $this->getCustomerValidationErrors($customer)
                        ];
                    }
                }

                if (!empty($validChunk)) {
                    try {
                        // Use upsert to handle duplicates
                        Customer::upsert($validChunk, ['customer_id'], [
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

                        $imported += count($validChunk);
                    } catch (\Exception $e) {
                        // If batch upsert fails, try individual inserts
                        $individualImported = 0;
                        foreach ($validChunk as $customer) {
                            try {
                                Customer::updateOrCreate(
                                    ['customer_id' => $customer['customer_id']],
                                    $customer
                                );
                                $individualImported++;
                            } catch (\Exception $individualError) {
                                $skippedRecords[] = [
                                    'customer_id' => $customer['customer_id'],
                                    'customer_name' => $customer['customer_name'] ?? 'unknown',
                                    'reason' => 'Database error',
                                    'details' => $this->sanitizeErrorMessage($individualError->getMessage())
                                ];
                            }
                        }
                        $imported += $individualImported;
                        $skipped += count($validChunk) - $individualImported;
                    }
                }

                $skipped += $invalidCount;

                // Update progress with more detailed message
                $progress = 40 + (($index + 1) / $totalChunks) * 25; // 40% to 65%
                $message = "Chunk " . ($index + 1) . "/" . $totalChunks . ": {$imported} customers imported";
                if ($skipped > 0) {
                    $message .= ", {$skipped} skipped";
                }
                $this->updateProgress($progressId, (int)$progress, $message);
            } catch (\Exception $e) {
                $chunkSize = count($chunk);
                $skipped += $chunkSize;

                // Track all records in failed chunk as skipped
                foreach ($chunk as $customer) {
                    $skippedRecords[] = [
                        'customer_id' => $customer['customer_id'] ?? 'unknown',
                        'customer_name' => $customer['customer_name'] ?? 'unknown',
                        'reason' => 'Chunk processing failed',
                        'details' => $this->sanitizeErrorMessage($e->getMessage())
                    ];
                }

                Log::warning('Failed to import customer chunk', [
                    'chunk_index' => $index,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        // Store detailed skipped records in cache for frontend retrieval
        if (!empty($skippedRecords)) {
            $skippedCacheKey = "import_skipped_customers_{$progressId}";
            Cache::put($skippedCacheKey, $skippedRecords, 3600); // Cache for 1 hour
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($customersData),
            'skipped_records' => array_slice($skippedRecords, 0, 50), // Return first 50 for immediate display
            'has_more_skipped' => count($skippedRecords) > 50
        ];
    }

    private function importSubscriptions(array $subscriptionsData, string $progressId): array
    {
        $chunks = array_chunk($subscriptionsData, self::CHUNK_SIZE);
        $totalChunks = count($chunks);
        $imported = 0;
        $skipped = 0;
        $skippedRecords = []; // Track skipped records with details

        // Cache existing customer IDs for better performance
        $existingCustomerIds = Customer::pluck('customer_id')->toArray();
        $customerIdSet = array_flip($existingCustomerIds);

        Log::info('Starting subscription import', [
            'total_subscriptions' => count($subscriptionsData),
            'total_customers' => count($existingCustomerIds),
            'chunks' => $totalChunks
        ]);

        foreach ($chunks as $index => $chunk) {
            try {
                // Set longer timeout for database operations
                DB::connection()->getPdo()->setAttribute(\PDO::ATTR_TIMEOUT, 300); // 5 minutes

                // Filter out subscriptions with invalid customer_id
                $validChunk = [];
                $invalidCount = 0;

                foreach ($chunk as $subscription) {
                    if (isset($customerIdSet[$subscription['customer_id']])) {
                        $validChunk[] = $subscription;
                    } else {
                        $invalidCount++;
                        $skippedRecords[] = [
                            'subscription_id' => $subscription['subscription_id'] ?? 'unknown',
                            'customer_id' => $subscription['customer_id'] ?? 'unknown',
                            'reason' => 'Invalid customer reference',
                            'details' => 'Customer ID does not exist in database'
                        ];
                        Log::debug('Skipping subscription with invalid customer_id', [
                            'subscription_id' => $subscription['subscription_id'],
                            'customer_id' => $subscription['customer_id']
                        ]);
                    }
                }

                if (!empty($validChunk)) {
                    try {
                        // Use transaction to ensure consistency
                        DB::transaction(function () use ($validChunk) {
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
                        });

                        $imported += count($validChunk);

                        Log::info('Successfully imported subscription chunk', [
                            'chunk_index' => $index + 1,
                            'chunk_size' => count($validChunk),
                            'invalid_records' => $invalidCount,
                            'total_imported' => $imported,
                            'progress' => round((($index + 1) / $totalChunks) * 100, 1) . '%'
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Database error during subscription upsert', [
                            'chunk_index' => $index + 1,
                            'chunk_size' => count($validChunk),
                            'error' => $e->getMessage(),
                            'sql_state' => $e->getCode(),
                            'sample_record' => !empty($validChunk) ? [
                                'subscription_id' => $validChunk[0]['subscription_id'],
                                'customer_id' => $validChunk[0]['customer_id']
                            ] : null
                        ]);

                        // If batch upsert fails, try individual inserts to identify problematic records
                        Log::info('Attempting individual record insertion for failed chunk');
                        $individualImported = 0;
                        foreach ($validChunk as $subscription) {
                            try {
                                Subscription::updateOrCreate(
                                    ['subscription_id' => $subscription['subscription_id']],
                                    $subscription
                                );
                                $individualImported++;
                            } catch (\Exception $individualError) {
                                $skippedRecords[] = [
                                    'subscription_id' => $subscription['subscription_id'],
                                    'customer_id' => $subscription['customer_id'],
                                    'reason' => 'Database error',
                                    'details' => $this->sanitizeErrorMessage($individualError->getMessage())
                                ];
                                Log::warning('Individual subscription insert failed', [
                                    'subscription_id' => $subscription['subscription_id'],
                                    'customer_id' => $subscription['customer_id'],
                                    'error' => $individualError->getMessage()
                                ]);
                            }
                        }

                        $imported += $individualImported;
                        $skipped += count($validChunk) - $individualImported;

                        Log::info('Individual insert results for chunk ' . ($index + 1), [
                            'attempted' => count($validChunk),
                            'successful' => $individualImported,
                            'failed' => count($validChunk) - $individualImported
                        ]);
                    }
                } else {
                    Log::info('No valid subscriptions in chunk', [
                        'chunk_index' => $index + 1,
                        'total_records' => count($chunk),
                        'invalid_records' => $invalidCount
                    ]);
                }

                $skipped += $invalidCount;

                // Update progress with more detailed message
                $progress = 70 + (($index + 1) / $totalChunks) * 25; // 70% to 95%
                $message = "Chunk " . ($index + 1) . "/" . $totalChunks . ": {$imported} subscriptions imported";
                if ($skipped > 0) {
                    $message .= ", {$skipped} skipped";
                }
                $this->updateProgress($progressId, (int)$progress, $message);

                // Add small delay to prevent overwhelming the database
                usleep(100000); // 0.1 second delay

            } catch (\Exception $e) {
                $chunkSize = count($chunk);
                $skipped += $chunkSize;

                // Track all records in failed chunk as skipped
                foreach ($chunk as $subscription) {
                    $skippedRecords[] = [
                        'subscription_id' => $subscription['subscription_id'] ?? 'unknown',
                        'customer_id' => $subscription['customer_id'] ?? 'unknown',
                        'reason' => 'Chunk processing failed',
                        'details' => $this->sanitizeErrorMessage($e->getMessage())
                    ];
                }

                Log::error('Failed to process subscription chunk', [
                    'chunk_index' => $index + 1,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                // Continue with next chunk rather than failing completely
                continue;
            }
        }

        // Store detailed skipped records in cache for frontend retrieval
        if (!empty($skippedRecords)) {
            $skippedCacheKey = "import_skipped_subscriptions_{$progressId}";
            Cache::put($skippedCacheKey, $skippedRecords, 3600); // Cache for 1 hour
        }

        Log::info('Subscription import completed', [
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($subscriptionsData),
            'success_rate' => $imported > 0 ? round(($imported / count($subscriptionsData)) * 100, 2) : 0,
            'skipped_details_count' => count($skippedRecords)
        ]);

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($subscriptionsData),
            'skipped_records' => array_slice($skippedRecords, 0, 50), // Return first 50 for immediate display
            'has_more_skipped' => count($skippedRecords) > 50
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

    public function getSkippedRecords(string $progressId, string $type): array
    {
        $cacheKey = "import_skipped_{$type}_{$progressId}";
        return Cache::get($cacheKey, []);
    }

    private function validateSubscriptionData(array $subscriptionData): bool
    {
        // Required fields check
        $requiredFields = ['subscription_id', 'customer_id'];

        foreach ($requiredFields as $field) {
            if (empty($subscriptionData[$field])) {
                Log::debug('Subscription validation failed: missing required field', [
                    'field' => $field,
                    'subscription_id' => $subscriptionData['subscription_id'] ?? 'unknown',
                ]);
                return false;
            }
        }

        // Validate subscription_id format (allow more flexible format)
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $subscriptionData['subscription_id'])) {
            Log::debug('Subscription validation failed: invalid subscription_id format', [
                'subscription_id' => $subscriptionData['subscription_id'],
            ]);
            return false;
        }

        // Validate customer_id format
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $subscriptionData['customer_id'])) {
            Log::debug('Subscription validation failed: invalid customer_id format', [
                'customer_id' => $subscriptionData['customer_id'],
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

    private function sanitizeErrorMessage(string $errorMessage): string
    {
        // Remove sensitive information and shorten long error messages
        $sanitized = preg_replace('/SQLSTATE\[[^]]+\]/', '', $errorMessage);
        $sanitized = preg_replace('/\(SQL:.*\)/', '', $sanitized);
        $sanitized = trim($sanitized);

        // Limit length to prevent UI issues
        if (strlen($sanitized) > 200) {
            $sanitized = substr($sanitized, 0, 200) . '...';
        }

        return $sanitized ?: 'Database constraint violation';
    }

    private function getValidationErrors(array $subscriptionData): string
    {
        $errors = [];

        if (empty($subscriptionData['subscription_id'])) {
            $errors[] = 'Missing subscription ID';
        } elseif (!preg_match('/^[a-zA-Z0-9_-]+$/', $subscriptionData['subscription_id'])) {
            $errors[] = 'Invalid subscription ID format';
        }

        if (empty($subscriptionData['customer_id'])) {
            $errors[] = 'Missing customer ID';
        } elseif (!preg_match('/^[a-zA-Z0-9_-]+$/', $subscriptionData['customer_id'])) {
            $errors[] = 'Invalid customer ID format';
        }

        return implode(', ', $errors) ?: 'General validation failure';
    }

    private function getCustomerValidationErrors(array $customerData): string
    {
        $errors = [];

        if (empty($customerData['customer_id'])) {
            $errors[] = 'Missing customer ID';
        } elseif (!preg_match('/^[a-zA-Z0-9_-]+$/', $customerData['customer_id'])) {
            $errors[] = 'Invalid customer ID format';
        }

        if (empty($customerData['customer_name'])) {
            $errors[] = 'Missing customer name';
        }

        return implode(', ', $errors) ?: 'General validation failure';
    }

    private function sanitizeDataForDatabase(array $data): array
    {
        // Define column length limits based on the database schema
        $stringLimits = [
            'subscription_address' => 255,
            'subscription_description' => 255,
            'subscription_maps' => 255,
            'subscription_home_photo' => 255,
            'subscription_form_scan' => 255,
            'cpe_picture' => 255,
            'attenuation_photo' => 255,
            'subscription_test_result' => 255,
            'customer_name' => 255,
            'customer_email' => 255,
            'customer_address' => 255,
            'customer_phone' => 255,
        ];

        foreach ($data as $key => $value) {
            if (isset($stringLimits[$key]) && is_string($value) && strlen($value) > $stringLimits[$key]) {
                // Truncate and add indicator
                $data[$key] = substr($value, 0, $stringLimits[$key] - 3) . '...';

                Log::debug('Truncated long field value', [
                    'field' => $key,
                    'original_length' => strlen($value),
                    'truncated_length' => strlen($data[$key]),
                    'record_id' => $data['subscription_id'] ?? $data['customer_id'] ?? 'unknown'
                ]);
            }
        }

        return $data;
    }
}
