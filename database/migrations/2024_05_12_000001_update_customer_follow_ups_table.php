<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customer_follow_ups', function (Blueprint $table) {
            // Check if subscription_id column exists
            if (Schema::hasColumn('customer_follow_ups', 'subscription_id')) {
                // Drop foreign key constraints first if they exist
                $foreignKeys = $this->getForeignKeys('customer_follow_ups');

                if (in_array('customer_follow_ups_subscription_id_foreign', $foreignKeys)) {
                    $table->dropForeign(['subscription_id']);
                }

                // Now drop the column
                $table->dropColumn('subscription_id');
            }

            // Check if maintenance_id column exists
            if (Schema::hasColumn('customer_follow_ups', 'maintenance_id')) {
                // Drop foreign key if it exists
                $foreignKeys = $this->getForeignKeys('customer_follow_ups');

                if (in_array('customer_follow_ups_maintenance_id_foreign', $foreignKeys)) {
                    $table->dropForeign(['maintenance_id']);
                }

                // Now drop the column
                $table->dropColumn('maintenance_id');
            }
        });
    }

    /**
     * Get foreign key constraints for a table
     */
    private function getForeignKeys($tableName)
    {
        $foreignKeys = [];
        $constraints = DB::select(
            "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
            WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' 
            AND TABLE_NAME = '{$tableName}'"
        );

        foreach ($constraints as $constraint) {
            $foreignKeys[] = $constraint->CONSTRAINT_NAME;
        }

        return $foreignKeys;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_follow_ups', function (Blueprint $table) {
            // Add back the columns if they don't exist
            if (!Schema::hasColumn('customer_follow_ups', 'subscription_id')) {
                $table->string('subscription_id')->nullable();

                // Re-add foreign key
                $table->foreign('subscription_id')
                    ->references('subscription_id')
                    ->on('subscriptions')
                    ->onDelete('set null');
            }

            if (!Schema::hasColumn('customer_follow_ups', 'maintenance_id')) {
                $table->string('maintenance_id')->nullable();

                // Re-add foreign key
                $table->foreign('maintenance_id')
                    ->references('ticket_id')
                    ->on('maintenances')
                    ->onDelete('set null');
            }
        });
    }
};
