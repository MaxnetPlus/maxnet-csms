<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->string('subscription_id')->primary();
            $table->string('subscription_password');
            $table->string('customer_id');
            $table->string('serv_id');
            $table->string('group');
            $table->string('created_by');
            $table->string('subscription_start_date')->nullable();
            $table->string('subscription_billing_cycle')->nullable();
            $table->string('subscription_price')->nullable();
            $table->string('subscription_address')->nullable();
            $table->string('subscription_status')->nullable();
            $table->string('subscription_maps')->nullable();
            $table->string('subscription_home_photo')->nullable();
            $table->string('subscription_form_scan')->nullable();
            $table->string('subscription_description')->nullable();
            $table->string('cpe_type')->nullable();
            $table->string('cpe_serial')->nullable();
            $table->string('cpe_picture')->nullable();
            $table->string('cpe_site')->nullable();
            $table->string('cpe_mac')->nullable();
            $table->boolean('is_cpe_rent')->nullable();
            $table->dateTime('dismantle_at')->nullable();
            $table->dateTime('suspend_at')->nullable();
            $table->string('installed_by')->nullable();
            $table->string('subscription_test_result')->nullable();
            $table->string('odp_distance')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->dateTime('installed_at')->nullable();
            $table->integer('index_month')->default(0);
            $table->string('attenuation_photo')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('handle_by')->nullable();
            $table->timestamps();

            // foreign key
            $table->foreign('customer_id')
                ->references('customer_id')
                ->on('customers')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
