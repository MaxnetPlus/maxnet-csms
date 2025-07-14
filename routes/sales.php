<?php

use App\Http\Controllers\Sales\SalesDashboardController;
use App\Http\Controllers\Sales\ProspectController;
use App\Http\Controllers\Sales\CustomerFollowUpController;
use Illuminate\Support\Facades\Route;

// Sales routes with authentication and sales permission middleware
Route::middleware(['auth', 'verified', 'can:access-sales'])->prefix('sales')->name('sales.')->group(function () {

    // Dashboard
    Route::get('/', [SalesDashboardController::class, 'index'])->name('dashboard');

    // Prospects management
    Route::resource('prospects', ProspectController::class);
    Route::post('prospects/{prospect}/convert', [ProspectController::class, 'convert'])->name('prospects.convert');
    Route::post('prospects/{prospect}/update-status', [ProspectController::class, 'updateStatus'])->name('prospects.update-status');

    // Customer Follow Up
    Route::get('follow-ups', [CustomerFollowUpController::class, 'index'])->name('follow-ups.index');
    Route::get('follow-ups/{followUp}', [CustomerFollowUpController::class, 'show'])->name('follow-ups.show');
    Route::post('follow-ups/{followUp}/complete', [CustomerFollowUpController::class, 'complete'])->name('follow-ups.complete');
    Route::post('follow-ups/{followUp}/update-notes', [CustomerFollowUpController::class, 'updateNotes'])->name('follow-ups.update-notes');

    // API routes untuk mobile-friendly AJAX requests
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('stats', [SalesDashboardController::class, 'getStats'])->name('stats');
        Route::get('prospects-nearby', [ProspectController::class, 'getNearbyProspects'])->name('prospects.nearby');
        Route::get('target-progress', [SalesDashboardController::class, 'getTargetProgress'])->name('target.progress');
    });
});
