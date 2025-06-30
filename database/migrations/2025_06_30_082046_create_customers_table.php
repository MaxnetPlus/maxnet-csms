<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->string('customer_id')->primary();
            $table->string('customer_password')->nullable();
            $table->string('customer_name');
            $table->string('referral_source')->nullable();
            $table->string('customer_email')->nullable()->index();
            $table->string('customer_address')->nullable();
            $table->string('customer_phone');
            $table->string('customer_ktp_no')->nullable();
            $table->string('customer_ktp_picture')->nullable();
            $table->string('password_reset')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
