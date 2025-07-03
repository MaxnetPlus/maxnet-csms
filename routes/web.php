<?php

use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->get('/', function () {
    return Inertia::render('auth/login');
})->name('home');


// Public route for accepting invitations
Route::get('invitation/accept/{token}', function ($token) {
    return Inertia::render('auth/AcceptInvitation', ['token' => $token]);
})->name('invitation.accept');

Route::post('invitation/accept/{token}', [UserController::class, 'acceptInvitation'])
    ->name('invitation.accept.store');

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });

Route::middleware(['auth', 'verified'])->get('dashboard', [ReportController::class, 'index'])
    ->name('dashboard');

require __DIR__ . '/admin.php';
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
