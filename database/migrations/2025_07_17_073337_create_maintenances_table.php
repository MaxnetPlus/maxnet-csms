<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('maintenances', function (Blueprint $table) {
            $table->string('ticket_id')->primary();
            $table->string('subscription_id')->nullable();
            $table->string('customer_id')->nullable();
            $table->text('subject_problem')->nullable();
            $table->text('customer_report')->nullable();
            $table->text('technician_update_desc')->nullable();
            $table->string('work_by')->nullable();
            $table->string('open_by')->nullable();
            $table->timestamp('open_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamp('ticket_close_date')->nullable();
            $table->string('status')->nullable();
            $table->string('picture_from_customer')->nullable();
            $table->string('picture_from_technician')->nullable();
            $table->string('handle_by')->nullable();
            $table->string('handle_by_team')->nullable();
            $table->timestamps();

            // Add indexes for better performance
            $table->index('subscription_id');
            $table->index('customer_id');
            $table->index('status');
        });

        // Add index for TEXT column separately using raw SQL
        DB::statement('ALTER TABLE maintenances ADD INDEX maintenances_subject_problem_index (subject_problem(255))');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenances');
    }
};
