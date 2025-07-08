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
        Schema::table('subscriptions', function (Blueprint $table) {
            // Composite index untuk query yang sering digunakan
            $table->index(['subscription_status', 'subscription_maps'], 'idx_status_maps');

            // Index untuk created_at untuk sorting
            $table->index('created_at', 'idx_created_at');

            // Index untuk serv_id untuk search
            $table->index('serv_id', 'idx_serv_id');
        });

        Schema::table('customers', function (Blueprint $table) {
            // Index untuk customer search fields
            $table->index('customer_name', 'idx_customer_name');
            $table->index('customer_phone', 'idx_customer_phone');
            $table->index('customer_email', 'idx_customer_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('idx_status_maps');
            $table->dropIndex('idx_created_at');
            $table->dropIndex('idx_serv_id');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('idx_customer_name');
            $table->dropIndex('idx_customer_phone');
            $table->dropIndex('idx_customer_email');
        });
    }
};
