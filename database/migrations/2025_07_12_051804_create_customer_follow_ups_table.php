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
        Schema::create('customer_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->string('customer_id');
            $table->string('subscription_id')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->text('resolution')->nullable();
            $table->string('assigned_to')->nullable(); // User ID who is assigned to follow up
            $table->string('created_by'); // User ID who created the follow up
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('customer_id')
                ->references('customer_id')
                ->on('customers')
                ->onDelete('cascade');

            $table->foreign('subscription_id')
                ->references('subscription_id')
                ->on('subscriptions')
                ->onDelete('set null');

            // Indexes
            $table->index(['customer_id', 'status']);
            $table->index(['priority', 'status']);
            $table->index('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_follow_ups');
    }
};
