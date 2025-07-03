<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Password;

class TestPasswordReset extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:password-reset {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test password reset functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        $this->info("Testing password reset for: {$email}");

        // Check if user exists
        $user = User::where('email', $email)->first();
        if (!$user) {
            $this->error("User with email {$email} not found!");
            return 1;
        }

        $this->info("User found: {$user->name} ({$user->email})");

        // Attempt to send reset link
        $status = Password::sendResetLink(['email' => $email]);

        $this->info("Password reset status: {$status}");

        switch ($status) {
            case Password::RESET_LINK_SENT:
                $this->info("✅ Password reset link sent successfully!");
                break;
            case Password::INVALID_USER:
                $this->error("❌ Invalid user - user not found");
                break;
            case Password::RESET_THROTTLED:
                $this->error("❌ Reset throttled - too many attempts");
                break;
            default:
                $this->error("❌ Unknown status: {$status}");
        }

        return 0;
    }
}
