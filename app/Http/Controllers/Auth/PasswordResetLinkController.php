<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Debug: Log the attempt
        Log::info('Password reset requested for: ' . $request->email);

        // Send password reset link
        $status = Password::sendResetLink(
            $request->only('email')
        );

        // Debug: Log the result
        Log::info('Password reset status: ' . $status);

        // Check if the reset link was sent successfully
        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('status', __('Password reset link sent to your email.'));
        }

        // If user not found or other error
        return back()->withErrors(['email' => __($status)]);
    }
}
