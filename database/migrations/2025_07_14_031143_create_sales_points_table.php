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
        Schema::create('sales_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('prospect_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('points_earned');
            $table->integer('accumulated_points')->default(0);
            $table->date('date');
            $table->enum('type', ['daily', 'bonus', 'penalty'])->default('daily');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['sales_id', 'date']);
            $table->index(['sales_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_points');
    }
};
