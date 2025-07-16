<?php

namespace Database\Seeders;

use App\Models\ProspectCategory;
use Illuminate\Database\Seeder;

class ProspectCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Customer Rumahan',
                'description' => 'Prospek customer untuk paket rumahan/personal',
                'points' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Customer Perusahaan',
                'description' => 'Prospek customer untuk paket bisnis/perusahaan',
                'points' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Customer Premium',
                'description' => 'Prospek customer untuk paket premium/dedicated',
                'points' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Customer Warnet/Cafe',
                'description' => 'Prospek customer untuk warnet, cafe, atau usaha sejenis',
                'points' => 2,
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            ProspectCategory::firstOrCreate(
                ['name' => $category['name']],
                $category
            );
        }

        $this->command->info('👉 Kategori prospek berhasil di-seed.');
    }
}
