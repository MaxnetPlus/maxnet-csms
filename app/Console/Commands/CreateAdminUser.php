<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    protected $signature = 'user:create-admin {email} {name} {password}';
    protected $description = 'Create an admin user';

    public function handle()
    {
        $email = $this->argument('email');
        $name = $this->argument('name');
        $password = $this->argument('password');

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        $user->assignRole('admin');

        $this->info("Admin user created successfully!");
        $this->info("Email: {$email}");
        $this->info("Password: {$password}");
    }
}
