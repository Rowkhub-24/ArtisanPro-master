<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds automation-related columns to the litiges table.
     * Requirements: 8.5
     */
    public function up(): void
    {
        Schema::table('litiges', function (Blueprint $table) {
            if (! Schema::hasColumn('litiges', 'source_resolution')) {
                $table->enum('source_resolution', ['auto', 'admin'])->default('admin')->after('resolution_details');
            }

            if (! Schema::hasColumn('litiges', 'score_preuve_gps')) {
                $table->decimal('score_preuve_gps', 5, 2)->nullable()->after('source_resolution');
            }

            if (! Schema::hasColumn('litiges', 'decision_auto')) {
                $table->json('decision_auto')->nullable()->after('score_preuve_gps');
            }
        });
    }

    /**
     * Reverse the migrations.
     * Rolls back automation columns from litiges table.
     * Requirements: 8.6
     */
    public function down(): void
    {
        Schema::table('litiges', function (Blueprint $table) {
            $columns = ['source_resolution', 'score_preuve_gps', 'decision_auto'];

            $existingColumns = array_filter(
                $columns,
                fn (string $col) => Schema::hasColumn('litiges', $col)
            );

            if (! empty($existingColumns)) {
                $table->dropColumn(array_values($existingColumns));
            }
        });
    }
};
