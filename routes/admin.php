<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\DatabaseImportController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\CancelSubscriptionController;
use Illuminate\Support\Facades\Route;

// Admin routes with authentication and permission middleware
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {

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

    // Cancel Subscription routes
    Route::middleware('can:view-reports')->prefix('cancel-subscription')->name('cancel-subscription.')->group(function () {
        Route::get('/', [CancelSubscriptionController::class, 'index'])->name('index');
        Route::get('/map-data', [CancelSubscriptionController::class, 'mapData'])->name('map-data');
        Route::get('/clustered-map-data', [CancelSubscriptionController::class, 'clusteredMapData'])->name('clustered-map-data');
        Route::post('/table-data', [CancelSubscriptionController::class, 'tableData'])->name('table-data');
        Route::get('/clustered-data', [CancelSubscriptionController::class, 'clusteredData'])->name('clustered-data');
        Route::get('/export', [CancelSubscriptionController::class, 'export'])->name('export');
    });
});
