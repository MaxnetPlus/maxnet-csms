<?php

use App\Http\Controllers\Admin\DismantleSubscriptionController;
use App\Http\Controllers\Admin\SuspendSubscriptionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\DatabaseImportController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\CancelSubscriptionController;
use App\Http\Controllers\Admin\SubscriptionController;
use App\Http\Controllers\Admin\CustomerFollowUpController;
use App\Http\Controllers\Admin\SalesManagementController;
use App\Http\Controllers\Admin\ProspectManagementController;
use App\Http\Controllers\Admin\ProspectCategoryController;
use Illuminate\Support\Facades\Route;

// Admin routes with authentication and permission middleware
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {

    // admin root url redirect to REportController
    Route::get('/', function () {
        return redirect()->route('admin.reports.index');
    })->name('root');

    // User management routes
    Route::middleware('can:view-users')->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
    });



    Route::middleware('can:manage-users')->group(function () {
        // Move create route before the show route to avoid "create" being treated as a user ID
        Route::get('users/create', [UserController::class, 'create'])->name('users.create');
        Route::get('users/invite', [UserController::class, 'invite'])->name('users.invite');
        Route::get('users/invitation-history', [UserController::class, 'invitationHistory'])->name('users.invitation-history');
        Route::post('users/invite', [UserController::class, 'sendInvitation'])->name('users.send-invitation');
        Route::delete('users/invitations/{invitation}', [UserController::class, 'destroyInvitation'])->name('users.invitations.destroy');
        Route::post('users/invitations/{invitation}/resend', [UserController::class, 'resendInvitation'])->name('users.invitations.resend');
        Route::post('users/invitations/bulk-delete', [UserController::class, 'bulkDeleteInvitations'])->name('users.invitations.bulk-delete');
        Route::post('users/invitations/bulk-resend', [UserController::class, 'bulkResendInvitations'])->name('users.invitations.bulk-resend');
        Route::post('users', [UserController::class, 'store'])->name('users.store');

        // SSO users approval routes
        Route::get('users/sso-pending', [UserController::class, 'pendingSSOUsers'])->name('users.sso-pending');
        Route::post('users/{user}/approve', [UserController::class, 'approveSSOUser'])->name('users.approve-sso');
        Route::post('users/{user}/reject', [UserController::class, 'rejectSSOUser'])->name('users.reject-sso');

        // These routes should come after the create route
        Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // Role & Permission management routes
    Route::middleware('can:manage-roles-and-permissions')->group(function () {
        Route::get('roles-permissions', [RolePermissionController::class, 'index'])->name('roles-permissions.index');

        // Role routes
        Route::post('roles', [RolePermissionController::class, 'storeRole'])->name('roles.store');
        Route::put('roles/{role}', [RolePermissionController::class, 'updateRole'])->name('roles.update');
        Route::delete('roles/{role}', [RolePermissionController::class, 'destroyRole'])->name('roles.destroy');

        // Permission routes
        Route::post('permissions', [RolePermissionController::class, 'storePermission'])->name('permissions.store');
        Route::put('permissions/{permission}', [RolePermissionController::class, 'updatePermission'])->name('permissions.update');
        Route::delete('permissions/{permission}', [RolePermissionController::class, 'destroyPermission'])->name('permissions.destroy');
    });

    // Database Import routes
    Route::middleware('can:import-database')->group(function () {
        Route::get('database-import', [DatabaseImportController::class, 'index'])->name('database-import.index');
        Route::post('database-import/upload', [DatabaseImportController::class, 'upload'])->name('database-import.upload');
        Route::post('database-import/progress', [DatabaseImportController::class, 'progress'])->name('database-import.progress');
        Route::post('database-import/results', [DatabaseImportController::class, 'getResults'])->name('database-import.results');
        Route::post('database-import/skipped-records', [DatabaseImportController::class, 'getSkippedRecords'])->name('database-import.skipped-records');
    });

    // Reports routes
    Route::middleware('can:view-reports')->group(function () {
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/export', [ReportController::class, 'export'])->name('reports.export');
    });

    // Subscription Management routes
    Route::middleware('can:view-reports')->prefix('subscriptions')->name('subscriptions.')->group(function () {
        Route::get('/', [SubscriptionController::class, 'index'])->name('index');
        Route::get('/export', [SubscriptionController::class, 'export'])->name('export');
        Route::post('/table-data', [SubscriptionController::class, 'tableData'])->name('table-data');
        Route::get('/{subscription}', [SubscriptionController::class, 'show'])->name('show');
    });

    // Cancel Subscription routes
    Route::middleware('can:view-reports')->prefix('cancel-subscription')->name('cancel-subscription.')->group(function () {
        Route::get('/', [CancelSubscriptionController::class, 'index'])->name('index');
        Route::get('/map-data', [CancelSubscriptionController::class, 'mapData'])->name('map-data');
        Route::get('/clustered-map-data', [CancelSubscriptionController::class, 'clusteredMapData'])->name('clustered-map-data');
        Route::post('/table-data', [CancelSubscriptionController::class, 'tableData'])->name('table-data');
        Route::get('/clustered-data', [CancelSubscriptionController::class, 'clusteredData'])->name('clustered-data');
        Route::get('/export', [CancelSubscriptionController::class, 'export'])->name('export');
    });


    Route::middleware('can:view-reports')->prefix('dismantle-subscription')->name('dismantle-subscription.')->group(function () {
        Route::get('/', [DismantleSubscriptionController::class, 'index'])->name('index');
        Route::get('/map-data', [DismantleSubscriptionController::class, 'mapData'])->name('map-data');
        Route::get('/clustered-map-data', [DismantleSubscriptionController::class, 'clusteredMapData'])->name('clustered-map-data');
        Route::post('/table-data', [DismantleSubscriptionController::class, 'tableData'])->name('table-data');
        Route::get('/clustered-data', [DismantleSubscriptionController::class, 'clusteredData'])->name('clustered-data');
        Route::get('/export', [DismantleSubscriptionController::class, 'export'])->name('export');
    });
    Route::middleware('can:view-reports')->prefix('suspend-subscription')->name('suspend-subscription.')->group(function () {
        Route::get('/', [SuspendSubscriptionController::class, 'index'])->name('index');
        Route::get('/map-data', [SuspendSubscriptionController::class, 'mapData'])->name('map-data');
        Route::get('/clustered-map-data', [SuspendSubscriptionController::class, 'clusteredMapData'])->name('clustered-map-data');
        Route::post('/table-data', [SuspendSubscriptionController::class, 'tableData'])->name('table-data');
        Route::get('/clustered-data', [SuspendSubscriptionController::class, 'clusteredData'])->name('clustered-data');
        Route::get('/export', [SuspendSubscriptionController::class, 'export'])->name('export');
    });

    // Customer Follow Up routes
    Route::middleware('can:view-reports')->prefix('follow-ups')->name('follow-ups.')->group(function () {
        Route::get('/', [CustomerFollowUpController::class, 'index'])->name('index');
        Route::post('/table-data', [CustomerFollowUpController::class, 'tableData'])->name('table-data');
        Route::get('/search-customers', [CustomerFollowUpController::class, 'searchCustomers'])->name('search-customers');
        Route::get('/create', [CustomerFollowUpController::class, 'create'])->name('create');
        Route::post('/', [CustomerFollowUpController::class, 'store'])->name('store');
        Route::get('/{followUp}', [CustomerFollowUpController::class, 'show'])->name('show');
        Route::get('/{followUp}/edit', [CustomerFollowUpController::class, 'edit'])->name('edit');
        Route::put('/{followUp}', [CustomerFollowUpController::class, 'update'])->name('update');
        Route::patch('/{followUp}', [CustomerFollowUpController::class, 'update'])->name('patch');
        Route::delete('/{followUp}', [CustomerFollowUpController::class, 'destroy'])->name('destroy');
        Route::get('/export/excel', [CustomerFollowUpController::class, 'export'])->name('export');
        Route::get('/create-from-subscription', [CustomerFollowUpController::class, 'createFromSubscription'])->name('create-from-subscription');
    });

    // Subscription follow up routes
    Route::middleware('can:view-reports')->prefix('subscriptions')->name('subscriptions.')->group(function () {
        Route::post('/{subscription}/follow-up', [SubscriptionController::class, 'createFollowUp'])->name('create-follow-up');
    });

    // Sales Management routes
    Route::middleware('can:manage-sales-targets')->prefix('sales-management')->name('sales-management.')->group(function () {
        Route::get('/', [SalesManagementController::class, 'index'])->name('index');
        Route::get('/{salesManagement}', [SalesManagementController::class, 'show'])->name('show');
        Route::get('/{salesManagement}/edit', [SalesManagementController::class, 'edit'])->name('edit');
        Route::put('/{salesManagement}', [SalesManagementController::class, 'update'])->name('update');
        Route::delete('/{salesManagement}', [SalesManagementController::class, 'destroy'])->name('destroy');
    });

    // Prospect Management routes  
    Route::middleware('can:manage-prospects')->prefix('prospect-management')->name('prospect-management.')->group(function () {
        Route::get('/', [ProspectManagementController::class, 'index'])->name('index');
        Route::post('/table-data', [ProspectManagementController::class, 'tableData'])->name('table-data');
        Route::get('/table-data', [ProspectManagementController::class, 'tableData'])->name('table-data-get'); // Support GET as well
        Route::get('/export', [ProspectManagementController::class, 'export'])->name('export');
        Route::get('/{prospect}', [ProspectManagementController::class, 'show'])->name('show');
        Route::delete('/{prospect}', [ProspectManagementController::class, 'destroy'])->name('destroy');
        Route::patch('/{prospect}/status', [ProspectManagementController::class, 'updateStatus'])->name('update-status');
        Route::post('/{prospect}/approve', [ProspectManagementController::class, 'approve'])->name('approve');
        Route::post('/bulk-approve', [ProspectManagementController::class, 'bulkApprove'])->name('bulk-approve');
    });

    // Prospect Categories Management routes
    Route::middleware('can:manage-prospect-categories')->prefix('prospect-categories')->name('prospect-categories.')->group(function () {
        Route::get('/', [ProspectCategoryController::class, 'index'])->name('index');
        Route::get('/create', [ProspectCategoryController::class, 'create'])->name('create');
        Route::post('/', [ProspectCategoryController::class, 'store'])->name('store');
        Route::get('/{prospectCategory}', [ProspectCategoryController::class, 'show'])->name('show');
        Route::get('/{prospectCategory}/edit', [ProspectCategoryController::class, 'edit'])->name('edit');
        Route::put('/{prospectCategory}', [ProspectCategoryController::class, 'update'])->name('update');
        Route::patch('/{prospectCategory}/toggle-status', [ProspectCategoryController::class, 'toggleStatus'])->name('toggle-status');
        Route::delete('/{prospectCategory}', [ProspectCategoryController::class, 'destroy'])->name('destroy');
    });
});
