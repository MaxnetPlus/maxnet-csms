<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class SSOAuthController extends Controller
{
    /**
     * Handle an incoming SSO authentication request.
     */
    public function authenticate(Request $request)
    {
        $validated = $request->validate([
            'usernameOrEmail' => 'required|string',
            'password' => 'required|string',
        ]);

        try {
            // Make request to the SSO API
            $response = Http::post('https://sso-api.kabeltelekom.net/api/v1/login', [
                'usernameOrEmail' => $validated['usernameOrEmail'],
                'password' => $validated['password'],
                'url' => 'https://dibi.kabeltelekom.com',
            ]);

            // Log the raw response for debugging
            Log::info('SSO API Raw Response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if (!$response->successful()) {
                throw ValidationException::withMessages([
                    'usernameOrEmail' => 'The provided credentials are incorrect.',
                ]);
            }

            $ssoData = $response->json();

            Log::info('SSO API Response:', $ssoData);

            // Handle error response explicitly
            if (isset($ssoData['status']) && $ssoData['status'] === 'error') {
                Log::warning('SSO Authentication failed with error status', [
                    'status' => $ssoData['status'],
                    'message' => $ssoData['message'] ?? 'No message provided'
                ]);
                throw ValidationException::withMessages([
                    'usernameOrEmail' => $ssoData['message'] ?? 'Invalid credentials',
                ]);
            }

            // Make sure we have a success response with the expected data structure
            if (!isset($ssoData['status']) || $ssoData['status'] !== 'success' || !isset($ssoData['data']) || !isset($ssoData['data']['user'])) {
                Log::error('Unexpected SSO API response structure', $ssoData);
                throw ValidationException::withMessages([
                    'usernameOrEmail' => 'Authentication failed. Unexpected response from SSO server.',
                ]);
            }

            $userData = $ssoData['data']['user'];

            // Check if user with this SSO ID exists
            $user = User::where('sso_id', $userData['id'])->first();

            // If not, check by email
            if (!$user) {
                $user = User::where('email', $userData['email'])->first();
            }

            // If still not found, create a new user
            if (!$user) {
                $user = $this->createUserFromSSO($userData, $ssoData['data']['token']);
            } else {
                // Update existing user with SSO data
                $this->updateUserFromSSO($user, $userData, $ssoData['data']['token']);
            }

            // Check if user is approved
            if (!$user->is_approved) {
                // Store user email in session for the pending page
                session(['pending_sso_email' => $user->email]);
                return redirect()->route('auth.pending-approval');
            }

            // Login the user
            Auth::login($user);
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard', absolute: false));
        } catch (\Exception $e) {
            Log::error('SSO Authentication error: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);

            if ($e instanceof ValidationException) {
                throw $e;
            }

            // For array access errors or other unexpected format issues
            if ($e instanceof \ErrorException || $e instanceof \TypeError) {
                throw ValidationException::withMessages([
                    'usernameOrEmail' => 'The SSO server returned an unexpected response format. Please try again later.',
                ]);
            }

            throw ValidationException::withMessages([
                'usernameOrEmail' => 'An error occurred during authentication. Please try again.',
            ]);
        }
    }

    /**
     * Create a new user from SSO data.
     */
    private function createUserFromSSO(array $userData, string $token): User
    {
        // Log the user data we're working with
        Log::info('Creating new user from SSO data', [
            'userData' => array_map(function ($item) {
                return is_string($item) ? (strlen($item) > 100 ? substr($item, 0, 100) . '...' : $item) : gettype($item);
            }, $userData)
        ]);

        try {
            $user = User::create([
                'sso_id' => $userData['id'],
                'name' => $userData['name'],
                'username' => $userData['username'] ?? null,
                'email' => $userData['email'],
                'photo_profile' => $userData['photo_profile'] ?? null,
                'phone_number' => $userData['phone_number'] ?? null,
                'address' => $userData['address'] ?? null,
                'department' => $userData['departement'] ?? null,
                'password' => Hash::make(uniqid()), // Random password since we'll use SSO
                'email_verified_at' => now(), // SSO users are considered verified
                'is_sso_user' => true,
                'is_approved' => false, // New SSO users need admin approval
                'last_login' => now(),
            ]);

            // Assign a default 'user' role
            $user->assignRole('user');

            return $user;
        } catch (\Exception $e) {
            Log::error('Error creating user from SSO data: ' . $e->getMessage(), [
                'userData' => $userData,
                'exception' => get_class($e)
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing user with SSO data.
     */
    private function updateUserFromSSO(User $user, array $userData, string $token): User
    {
        // Log the user data we're working with
        Log::info('Updating existing user from SSO data', [
            'userId' => $user->id,
            'userData' => array_map(function ($item) {
                return is_string($item) ? (strlen($item) > 100 ? substr($item, 0, 100) . '...' : $item) : gettype($item);
            }, $userData)
        ]);

        try {
            $user->update([
                'sso_id' => $userData['id'],
                'name' => $userData['name'],
                'username' => $userData['username'] ?? $user->username,
                'email' => $userData['email'],
                'photo_profile' => $userData['photo_profile'] ?? $user->photo_profile,
                'phone_number' => $userData['phone_number'] ?? $user->phone_number,
                'address' => $userData['address'] ?? $user->address,
                'department' => $userData['departement'] ?? $user->department,
                'is_sso_user' => true,
                'last_login' => now(),
            ]);

            return $user;
        } catch (\Exception $e) {
            Log::error('Error updating user from SSO data: ' . $e->getMessage(), [
                'userId' => $user->id,
                'userData' => $userData,
                'exception' => get_class($e)
            ]);
            throw $e;
        }
    }

    /**
     * Show the pending approval page.
     */
    public function pendingApproval(Request $request)
    {
        // If no pending email is in session, redirect to login
        if (!$request->session()->has('pending_sso_email')) {
            return redirect()->route('login');
        }
        $email = $request->session()->get('pending_sso_email');

        return inertia('auth/PendingApproval', [
            'email' => $email
        ]);
    }
}
