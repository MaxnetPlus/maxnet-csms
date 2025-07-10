<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('sso_id')->nullable()->after('id');
            $table->text('photo_profile')->nullable()->after('email_verified_at');
            $table->string('phone_number')->nullable()->after('photo_profile');
            $table->boolean('is_sso_user')->default(false)->after('phone_number');
            $table->boolean('is_approved')->default(true)->after('is_sso_user');
            $table->text('address')->nullable()->after('is_approved');
            $table->string('department')->nullable()->after('address');
            $table->timestamp('last_login')->nullable()->after('department');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'sso_id',
                'photo_profile',
                'phone_number',
                'is_sso_user',
                'is_approved',
                'address',
                'department',
                'last_login',
            ]);
        });
    }
};
