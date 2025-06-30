# GitHub Copilot Instructions - Laravel Database Import System

## Project Overview

Sistem web berbasis Laravel 12 dengan Inertia.js dan React untuk import dan manajemen database subscriptions dan customers. Sistem memiliki 2 role: Admin dan User dengan sistem invite berbasis email.

## Tech Stack

- **Backend**: Laravel 12
- **Frontend**: Inertia.js + React
- **UI Components**: shadcn/ui
- **Database**: MySQL/PostgreSQL
- **Authentication**: Laravel Sanctum/Breeze with Inertia
- **Email**: Laravel Mail

## Architecture Guidelines

### 1. Project Structure

```
app/
├── Http/Controllers/
│   ├── Admin/
│   ├── User/
│   └── Auth/
├── Models/
│   ├── User.php
│   ├── Customer.php
│   ├── Subscription.php
│   └── Invitation.php
├── Services/
│   ├── DatabaseImportService.php
│   └── InvitationService.php
└── Events/
    └── ImportProgressEvent.php

resources/js/
├── Components/
│   ├── ui/ (shadcn components)
│   ├── DataTable/
│   └── Forms/
├── Pages/
│   ├── Admin/
│   ├── User/
│   └── Auth/
└── Layouts/
```

### 2. Database Schema

```sql
-- Users table (extend default Laravel users)
users: id, name, email, role (admin/user), email_verified_at, created_at, updated_at

-- Invitations table
invitations: id, email, token, role, invited_by, expires_at, accepted_at, created_at, updated_at

-- Customers table (imported from external database)
customers:
- customer_id (varchar, PRIMARY KEY)
- customer_password (varchar, nullable)
- customer_name (varchar, required)
- referral_source (varchar, nullable)
- customer_email (varchar, nullable)
- customer_address (varchar, nullable)
- customer_phone (varchar, required)
- customer_ktp_no (varchar, nullable)
- customer_ktp_picture (varchar, nullable)
- password_reset (varchar, nullable)
- created_at, updated_at (timestamps)

-- Subscriptions table (imported from external database)
subscriptions:
- subscription_id (varchar, PRIMARY KEY)
- subscription_password (varchar, required)
- customer_id (varchar, required - FK to customers)
- serv_id (varchar, required)
- group (varchar, required)
- created_by (varchar, required)
- subscription_start_date (varchar, nullable)
- subscription_billing_cycle (varchar, nullable)
- subscription_price (varchar, nullable)
- subscription_address (varchar, nullable)
- subscription_status (varchar, nullable)
- subscription_maps (varchar, nullable)
- subscription_home_photo (varchar, nullable)
- subscription_form_scan (varchar, nullable)
- subscription_description (varchar, nullable)
- cpe_type (varchar, nullable)
- cpe_serial (varchar, nullable)
- cpe_picture (varchar, nullable)
- cpe_site (varchar, nullable)
- cpe_mac (varchar, nullable)
- is_cpe_rent (boolean, nullable)
- created_at, updated_at (timestamps)
- dismantle_at (datetime, nullable)
- suspend_at (datetime, nullable)
- installed_by (varchar, nullable)
- subscription_test_result (varchar, nullable)
- odp_distance (varchar, nullable)
- approved_at (timestamp, nullable)
- installed_at (datetime, nullable)
- index_month (integer, default 0)
- attenuation_photo (varchar, nullable)
- ip_address (varchar, nullable)
- handle_by (varchar, nullable)
```

## Development Guidelines

### 1. Laravel Backend Rules

- **Controllers**: Gunakan Resource Controllers dengan explicit route binding
- **Models**: Gunakan Eloquent relationships dan accessors/mutators
- **Validation**: Gunakan Form Request classes untuk validasi kompleks
- **Services**: Buat service classes untuk business logic yang kompleks
- **Jobs**: Gunakan queue jobs untuk import database yang besar (>10MB)
- **Middleware**: Buat custom middleware untuk role-based access

### 2. Inertia.js Patterns

```php
// Controller example
return Inertia::render('Admin/Dashboard', [
    'customers' => CustomerResource::collection($customers),
    'stats' => $this->getStats(),
]);
```

### 3. React Component Guidelines

- **Functional Components**: Gunakan hooks (useState, useForm dari Inertia)
- **Props Typing**: Gunakan TypeScript interfaces untuk props
- **State Management**: Gunakan Inertia's useForm untuk form handling
- **Error Handling**: Implementasi error boundaries dan toast notifications

### 4. shadcn/ui Usage

- Import components dari `@/components/ui/`
- Gunakan consistent spacing dan styling
- Implementasi dark/light mode support
- Prioritaskan accessibility

## Specific Implementation Requirements

### 1. Authentication & Authorization

```php
// Middleware untuk role checking
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::post('/admin/invite', [InvitationController::class, 'send']);
});

// Invitation system
php artisan make:controller InvitationController
php artisan make:job SendInvitationEmail
php artisan make:mail InvitationMail
```

### 2. Database Import Feature

```php
// Service class untuk import
class DatabaseImportService
{
    public function importFromSql(UploadedFile $file): array
    {
        // 1. Validate file (max 150MB, .sql extension)
        // 2. Parse SQL file untuk extract INSERT statements dari tabel subscriptions dan customers
        // 3. Extract data dari SQL INSERT statements
        // 4. Check existing records berdasarkan customer_id (customers) dan subscription_id (subscriptions)
        // 5. Insert hanya data baru (skip duplicates)
        // 6. Handle relationship: customer_id di subscriptions harus exist di customers
        // 7. Return summary (new customers, new subscriptions, skipped records)
    }

    private function parseCustomersFromSql(string $sqlContent): array
    {
        // Extract INSERT INTO `customers` statements
        // Parse values dan convert ke array associative
        // Handle escape characters dan quotes
    }

    private function parseSubscriptionsFromSql(string $sqlContent): array
    {
        // Extract INSERT INTO `subscriptions` statements
        // Parse values dengan semua 34+ columns
        // Handle data types (varchar, boolean, datetime, timestamp)
    }
}

// Model relationships
class Customer extends Model
{
    protected $primaryKey = 'customer_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'customer_id', 'customer_password', 'customer_name', 'referral_source',
        'customer_email', 'customer_address', 'customer_phone', 'customer_ktp_no',
        'customer_ktp_picture', 'password_reset'
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'customer_id', 'customer_id');
    }
}

class Subscription extends Model
{
    protected $primaryKey = 'subscription_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'subscription_id', 'subscription_password', 'customer_id', 'serv_id', 'group',
        'created_by', 'subscription_start_date', 'subscription_billing_cycle',
        'subscription_price', 'subscription_address', 'subscription_status',
        'subscription_maps', 'subscription_home_photo', 'subscription_form_scan',
        'subscription_description', 'cpe_type', 'cpe_serial', 'cpe_picture',
        'cpe_site', 'cpe_mac', 'is_cpe_rent', 'dismantle_at', 'suspend_at',
        'installed_by', 'subscription_test_result', 'odp_distance', 'approved_at',
        'installed_at', 'index_month', 'attenuation_photo', 'ip_address', 'handle_by'
    ];

    protected $casts = [
        'is_cpe_rent' => 'boolean',
        'approved_at' => 'datetime',
        'dismantle_at' => 'datetime',
        'suspend_at' => 'datetime',
        'installed_at' => 'datetime',
        'index_month' => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }
}

// Queue job untuk file besar
php artisan make:job ProcessDatabaseImport
```

### 3. DataTable Implementation

```jsx
// React DataTable component dengan shadcn/ui untuk customers dan subscriptions
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Customers DataTable columns
const customerColumns = [
    { accessorKey: 'customer_id', header: 'Customer ID' },
    { accessorKey: 'customer_name', header: 'Name' },
    { accessorKey: 'customer_email', header: 'Email' },
    { accessorKey: 'customer_phone', header: 'Phone' },
    { accessorKey: 'customer_address', header: 'Address' },
    { accessorKey: 'subscriptions_count', header: 'Subscriptions' },
    {
        id: 'actions',
        cell: ({ row }) => (
            <Button variant="outline" size="sm">
                View Subscriptions
            </Button>
        ),
    },
];

// Subscriptions DataTable columns
const subscriptionColumns = [
    { accessorKey: 'subscription_id', header: 'Subscription ID' },
    { accessorKey: 'customer_id', header: 'Customer ID' },
    { accessorKey: 'customer.customer_name', header: 'Customer Name' },
    { accessorKey: 'serv_id', header: 'Service ID' },
    { accessorKey: 'group', header: 'Group' },
    {
        accessorKey: 'subscription_status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.original.subscription_status === 'active' ? 'success' : 'secondary'}>{row.original.subscription_status}</Badge>
        ),
    },
    { accessorKey: 'subscription_price', header: 'Price' },
    { accessorKey: 'subscription_start_date', header: 'Start Date' },
    { accessorKey: 'subscription_billing_cycle', header: 'Billing Cycle' },
    { accessorKey: 'created_by', header: 'Created By' },
    { accessorKey: 'installed_by', header: 'Installed By' },
    { accessorKey: 'subscription_address', header: 'Address' },
];

// Customer detail dengan list subscriptions
const CustomerDetail = ({ customer }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="font-semibold">Customer Information</h3>
                    <p>ID: {customer.customer_id}</p>
                    <p>Name: {customer.customer_name}</p>
                    <p>Email: {customer.customer_email}</p>
                    <p>Phone: {customer.customer_phone}</p>
                    <p>KTP: {customer.customer_ktp_no}</p>
                </div>
            </div>

            <div>
                <h3 className="mb-4 font-semibold">Subscriptions ({customer.subscriptions.length})</h3>
                <DataTable columns={subscriptionColumns} data={customer.subscriptions} />
            </div>
        </div>
    );
};
```

### 4. File Upload Component

```jsx
// File upload dengan progress bar
import { Progress } from '@/components/ui/progress';
import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const ImportForm = () => {
    const { data, setData, post, processing } = useForm({ sql_file: null });
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsImporting(true);
        setProgress(0);

        // Start progress polling
        const progressInterval = setInterval(() => {
            fetch('/api/import/progress')
                .then((res) => res.json())
                .then((data) => {
                    setProgress(data.percentage || 0);
                    setProgressMessage(data.message || '');

                    if (data.percentage >= 100) {
                        clearInterval(progressInterval);
                        setIsImporting(false);
                    }
                });
        }, 1000);

        // Submit form
        post('/import', {
            onSuccess: () => {
                clearInterval(progressInterval);
                setIsImporting(false);
                setProgress(100);
                setProgressMessage('Import completed successfully!');
            },
            onError: () => {
                clearInterval(progressInterval);
                setIsImporting(false);
                setProgress(0);
                setProgressMessage('Import failed');
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="file" accept=".sql" onChange={(e) => setData('sql_file', e.target.files[0])} disabled={processing || isImporting} />

            {isImporting && (
                <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-gray-600">{progressMessage}</p>
                    <p className="text-sm font-medium">{progress}% Complete</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!data.sql_file || processing || isImporting}
                className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
            >
                {isImporting ? 'Importing...' : 'Import Database'}
            </button>
        </form>
    );
};
```

## Code Style & Conventions

### 1. PHP (Laravel)

- PSR-12 coding standard
- Camel case untuk methods, snake_case untuk properties
- Explicit return types untuk methods
- Gunakan strict typing: `declare(strict_types=1);`

### 2. JavaScript/React

- ES6+ syntax
- Functional components dengan hooks
- Destructuring assignment
- Consistent naming: camelCase untuk variables, PascalCase untuk components

### 3. Database

- Snake case untuk table dan column names
- Singular model names, plural table names
- Foreign keys: `{table}_id` format
- Timestamps: selalu gunakan `created_at` dan `updated_at`

## Security Requirements

- **SQL Injection**: Gunakan prepared statements dan parameter binding
- **File Upload**: Validate file type, size, dan scan for malicious content
- **CSRF Protection**: Ensure semua forms memiliki CSRF token
- **Rate Limiting**: Implement rate limiting untuk import endpoints
- **Input Validation**: Validate dan sanitize semua user input

## Performance Optimization

- **Database**: Index pada customer_id dan subscription_id (sudah ada sebagai primary keys)
- **Import**: Gunakan batch processing untuk insert bulk data (chunk 1000 records) dengan progress tracking
- **Frontend**: Progress bar dengan real-time updates menggunakan server-sent events atau polling
- **Caching**: Cache customer statistics dan subscription counts
- **File Processing**: Stream processing untuk file SQL besar dengan progress callback
- **Relationships**: Eager loading untuk customer-subscription relationships menggunakan `with()`
- **Memory Management**: Process data in chunks untuk menghindari memory exhaustion pada file besar

## Error Handling

- **Backend**: Custom exception classes dengan meaningful messages
- **Frontend**: Toast notifications untuk user feedback
- **Logging**: Log semua import activities dan errors
- **Validation**: Client-side dan server-side validation

## Testing Guidelines

- **Feature Tests**: Test semua API endpoints
- **Unit Tests**: Test service classes dan business logic
- **Browser Tests**: Test critical user flows dengan Dusk
- **Database**: Gunakan factories dan seeders untuk test data

## Deployment Considerations

- **Environment**: Separate config untuk development, staging, production
- **File Storage**: Gunakan appropriate storage driver (local/s3)
- **Database**: Migration rollback strategy
- **PHP Configuration**: Set max_execution_time dan memory_limit yang cukup untuk import besar

## Common Patterns to Follow

### 1. Import Flow

```php
// 1. Upload validation (file size max 150MB, .sql extension)
// 2. Parse SQL untuk extract INSERT statements customers dan subscriptions
// 3. Validate data structure dan required fields
// 4. Process import synchronously dengan progress tracking
// 5. Import customers first (master data) dengan progress callback
// 6. Import subscriptions dengan FK validation ke customers
// 7. Skip duplicate berdasarkan customer_id dan subscription_id
// 8. Real-time progress updates via server-sent events atau AJAX polling
// 9. DataTable refresh dengan new data setelah import selesai

// Import validation rules
$rules = [
    'sql_file' => 'required|file|mimes:sql|max:153600', // 150MB in KB
];

// Progress tracking example
class DatabaseImportService
{
    public function importWithProgress(UploadedFile $file, callable $progressCallback = null): array
    {
        $totalSteps = $this->calculateTotalSteps($file);
        $currentStep = 0;

        // Update progress: parsing file
        if ($progressCallback) $progressCallback(++$currentStep, $totalSteps, 'Parsing SQL file...');

        $customers = $this->parseCustomersFromSql($sqlContent);
        $subscriptions = $this->parseSubscriptionsFromSql($sqlContent);

        // Import customers in chunks
        foreach (array_chunk($customers, 1000) as $chunk) {
            Customer::upsert($chunk, ['customer_id'], [
                'customer_name', 'customer_email', 'customer_phone', 'customer_address',
                'customer_ktp_no', 'referral_source', 'updated_at'
            ]);

            if ($progressCallback) $progressCallback(++$currentStep, $totalSteps, 'Importing customers...');
        }

        // Import subscriptions in chunks
        foreach (array_chunk($subscriptions, 1000) as $chunk) {
            Subscription::upsert($chunk, ['subscription_id'], [
                'customer_id', 'serv_id', 'group', 'subscription_status',
                'subscription_price', 'subscription_start_date', 'updated_at'
            ]);

            if ($progressCallback) $progressCallback(++$currentStep, $totalSteps, 'Importing subscriptions...');
        }

        return ['customers' => count($customers), 'subscriptions' => count($subscriptions)];
    }
}

// Controller dengan progress tracking
class ImportController extends Controller
{
    public function import(Request $request)
    {
        $request->validate(['sql_file' => 'required|file|mimes:sql|max:153600']);

        $service = new DatabaseImportService();
        $progressFile = storage_path('app/import_progress_' . session()->getId() . '.json');

        $result = $service->importWithProgress($request->file('sql_file'), function($current, $total, $message) use ($progressFile) {
            file_put_contents($progressFile, json_encode([
                'current' => $current,
                'total' => $total,
                'percentage' => round(($current / $total) * 100, 2),
                'message' => $message,
                'timestamp' => now()
            ]));
        });

        // Clean up progress file
        if (file_exists($progressFile)) unlink($progressFile);

        return response()->json($result);
    }

    public function getProgress(Request $request)
    {
        $progressFile = storage_path('app/import_progress_' . session()->getId() . '.json');

        if (!file_exists($progressFile)) {
            return response()->json(['progress' => 0, 'message' => 'Not started']);
        }

        return response()->json(json_decode(file_get_contents($progressFile), true));
    }
}
```

### 2. Frontend Progress Bar Implementation

```jsx
// React component dengan real-time progress tracking
import { Progress } from '@/components/ui/progress';
import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const ImportForm = () => {
    const { data, setData, post, processing } = useForm({ sql_file: null });
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsImporting(true);
        setProgress(0);

        // Start progress polling
        const progressInterval = setInterval(() => {
            fetch('/api/import/progress')
                .then((res) => res.json())
                .then((data) => {
                    setProgress(data.percentage || 0);
                    setProgressMessage(data.message || '');

                    if (data.percentage >= 100) {
                        clearInterval(progressInterval);
                        setIsImporting(false);
                    }
                });
        }, 1000);

        // Submit form
        post('/import', {
            onSuccess: () => {
                clearInterval(progressInterval);
                setIsImporting(false);
                setProgress(100);
                setProgressMessage('Import completed successfully!');
            },
            onError: () => {
                clearInterval(progressInterval);
                setIsImporting(false);
                setProgress(0);
                setProgressMessage('Import failed');
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="file" accept=".sql" onChange={(e) => setData('sql_file', e.target.files[0])} disabled={processing || isImporting} />

            {isImporting && (
                <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-gray-600">{progressMessage}</p>
                    <p className="text-sm font-medium">{progress}% Complete</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!data.sql_file || processing || isImporting}
                className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
            >
                {isImporting ? 'Importing...' : 'Import Database'}
            </button>
        </form>
    );
};
```
