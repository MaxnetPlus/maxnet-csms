<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Buat akun Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@dibi.id'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password123'), // ganti sesuai kebutuhan
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole('admin');

        // Buat akun User biasa
        $user = User::firstOrCreate(
            ['email' => 'user@dibi.id'],
            [
                'name' => 'Regular User',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );
        $user->assignRole('user');

        $this->command->info('👉 Users (admin & user) berhasil di‑seed.');
    }
}
