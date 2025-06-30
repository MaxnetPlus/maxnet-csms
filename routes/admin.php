<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\DatabaseImportController;
use App\Http\Controllers\Admin\ReportController;
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
    });

    // Reports routes
    Route::middleware('can:view-reports')->group(function () {
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/export', [ReportController::class, 'export'])->name('reports.export');
    });
});
