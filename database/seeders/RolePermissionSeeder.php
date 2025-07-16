<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Hapus cache dulu biar perubahan langsung keliatan
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Daftar permission
        $perms = [
            'manage-users',
            'view-users',
            'import-database',
            'manage-invitations',
            'manage-roles-and-permissions',
            'view-reports',
            'export-data',
            'access-sales',
            'manage-prospects',
            'manage-sales-targets',
            'view-sales-dashboard',
            'manage-prospect-categories',
        ];
        foreach ($perms as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Buat role admin & beri semua permission
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($perms);

        // Buat role user & beri permission terbatas
        $user = Role::firstOrCreate(['name' => 'user']);
        $user->syncPermissions([
            'view-reports',
        ]);

        // Buat role sales & beri permission untuk sales
        $sales = Role::firstOrCreate(['name' => 'sales']);
        $sales->syncPermissions([
            'access-sales',
            'manage-prospects',
            'view-sales-dashboard',
        ]);

        $this->command->info('👉 Roles & permissions berhasil di‑seed.');
    }
}
