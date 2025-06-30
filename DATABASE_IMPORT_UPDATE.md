# Database Import Service - Update Summary

## Overview

The `DatabaseImportService.php` has been updated to correctly handle the import of subscriptions with all 34 columns, ensuring the import process matches the database schema exactly.

## Key Improvements Made

### 1. Complete Column Mapping

- **Customers**: All 10 columns properly mapped
- **Subscriptions**: All 34 columns properly mapped and validated

### 2. Enhanced Data Type Handling

- **Boolean values**: Improved parsing for `is_cpe_rent` field with support for various boolean representations (`1`, `true`, `yes`, `on`)
- **DateTime fields**: Consistent formatting for timestamp fields (`created_at`, `updated_at`, `approved_at`)
- **Nullable dates**: Proper handling of nullable datetime fields (`dismantle_at`, `suspend_at`, `installed_at`)
- **Integer fields**: Safe parsing for `index_month` with default fallback to 0

### 3. Data Validation

- Added validation methods for both customers and subscriptions
- Required field validation (e.g., `subscription_id`, `customer_id`, `serv_id` for subscriptions)
- Format validation for ID fields using regex patterns
- Comprehensive error logging for debugging

### 4. Error Handling & Logging

- Enhanced error logging for malformed rows
- Graceful handling of insufficient columns
- Detailed warnings for validation failures
- Progress tracking with meaningful status messages

## Database Schema Compliance

### Customers Table (10 columns)

1. `customer_id` (Primary Key)
2. `customer_password`
3. `customer_name`
4. `referral_source`
5. `customer_email`
6. `customer_address`
7. `customer_phone`
8. `customer_ktp_no`
9. `customer_ktp_picture`
10. `password_reset`

### Subscriptions Table (34 columns)

1. `subscription_id` (Primary Key)
2. `subscription_password`
3. `customer_id` (Foreign Key)
4. `serv_id`
5. `group`
6. `created_by`
7. `subscription_start_date`
8. `subscription_billing_cycle`
9. `subscription_price`
10. `subscription_address`
11. `subscription_status`
12. `subscription_maps`
13. `subscription_home_photo`
14. `subscription_form_scan`
15. `subscription_description`
16. `cpe_type`
17. `cpe_serial`
18. `cpe_picture`
19. `cpe_site`
20. `cpe_mac`
21. `is_cpe_rent` (Boolean)
22. `created_at` (Timestamp)
23. `updated_at` (Timestamp)
24. `dismantle_at` (Nullable DateTime)
25. `suspend_at` (Nullable DateTime)
26. `installed_by`
27. `subscription_test_result`
28. `odp_distance`
29. `approved_at` (Timestamp)
30. `installed_at` (Nullable DateTime)
31. `index_month` (Integer)
32. `attenuation_photo`
33. `ip_address`
34. `handle_by`

## Usage

### Basic Import

```php
use App\Services\DatabaseImportService;

$importService = new DatabaseImportService();
$result = $importService->importFromSql($uploadedFile);

// Result contains:
// - progress_id: for tracking progress
// - customers: import statistics
// - subscriptions: import statistics
```

### Progress Tracking

```php
$progressId = $result['progress_id'];
$progress = $importService->getProgress($progressId);

// Progress data:
// - percentage: 0-100 (or -1 for error)
// - message: Current status message
// - updated_at: Last update timestamp
```

## Import Process Flow

1. **File Reading**: SQL dump file is read and parsed
2. **Customer Parsing**: Extract and validate customer data
3. **Subscription Parsing**: Extract and validate subscription data (all 34 columns)
4. **Customer Import**: Import customers first (using upsert for duplicates)
5. **Subscription Import**: Import subscriptions with foreign key validation
6. **Progress Updates**: Real-time progress tracking with meaningful messages

## Data Validation Rules

### Customer Validation

- `customer_id` and `customer_name` are required
- `customer_id` must match pattern: `^[a-zA-Z0-9_-]+$`

### Subscription Validation

- `subscription_id`, `customer_id`, and `serv_id` are required
- `subscription_id` must match pattern: `^[a-zA-Z0-9_-]+$`
- Foreign key validation: `customer_id` must exist in customers table

## Error Handling

### Logging Categories

- **Parse Errors**: Issues with SQL parsing or column extraction
- **Validation Errors**: Data that fails validation rules
- **Import Errors**: Database insertion failures
- **Chunk Errors**: Issues with batch processing

### Recovery Mechanisms

- Skip invalid rows and continue processing
- Upsert operations prevent duplicate key errors
- Foreign key validation prevents orphaned subscriptions
- Detailed error logs for troubleshooting

## Testing

A comprehensive test suite has been created at `tests/Unit/DatabaseImportServiceTest.php` covering:

- SQL parsing for both customers and subscriptions
- All 34 subscription columns handling
- Data validation logic
- Type conversion functions
- Error scenarios

Run tests with:

```bash
php artisan test --filter=DatabaseImportServiceTest
```

## Performance Considerations

- **Chunked Processing**: Data is processed in chunks of 1000 records
- **Batch Inserts**: Using Laravel's `upsert()` for efficient bulk operations
- **Memory Management**: Streaming approach to handle large SQL files
- **Progress Caching**: Progress updates cached for 1 hour

## Monitoring and Debugging

Check Laravel logs for detailed error information:

```bash
tail -f storage/logs/laravel.log
```

Common log entries:

- `Failed to parse subscription row`: Column extraction issues
- `Subscription validation failed`: Data validation errors
- `Failed to import subscription chunk`: Database insertion errors
