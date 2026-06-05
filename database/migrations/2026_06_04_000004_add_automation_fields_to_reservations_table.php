<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds automation-related columns to the reservations table.
     * Note: adresse_intervention was previously added in 2026_05_22_000001 with VARCHAR(255).
     *       This migration extends it to VARCHAR(500) and adds GPS + source columns.
     * Requirements: 8.4
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Extend adresse_intervention to 500 chars if it already exists (was 255),
            // or add it fresh if it doesn't exist.
            if (Schema::hasColumn('reservations', 'adresse_intervention')) {
                $table->string('adresse_intervention', 500)->nullable()->change();
            } else {
                $table->string('adresse_intervention', 500)->nullable()->after('description_besoin');
            }

            if (! Schema::hasColumn('reservations', 'latitude_client')) {
                $table->decimal('latitude_client', 10, 8)->nullable()->after('adresse_intervention');
            }

            if (! Schema::hasColumn('reservations', 'longitude_client')) {
                $table->decimal('longitude_client', 11, 8)->nullable()->after('latitude_client');
            }

            if (! Schema::hasColumn('reservations', 'duree_estimee_min')) {
                $table->integer('duree_estimee_min')->nullable()->after('longitude_client');
            }

            if (! Schema::hasColumn('reservations', 'source_acceptation')) {
                $table->enum('source_acceptation', ['auto', 'manuel'])->default('manuel')->after('duree_estimee_min');
            }

            if (! Schema::hasColumn('reservations', 'source_devis')) {
                $table->enum('source_devis', ['auto', 'ia', 'manuel'])->default('manuel')->after('source_acceptation');
            }

            if (! Schema::hasColumn('reservations', 'source_validation')) {
                $table->enum('source_validation', ['auto', 'manuel'])->default('manuel')->after('source_devis');
            }

            if (! Schema::hasColumn('reservations', 'source_terminaison')) {
                $table->enum('source_terminaison', ['auto_gps', 'auto_timeout', 'manuel'])->nullable()->after('source_validation');
            }
        });
    }

    /**
     * Reverse the migrations.
     * Rolls back all automation columns added to reservations.
     * The original adresse_intervention (VARCHAR 255) from the previous migration is restored
     * by simply dropping the column and letting the earlier migration manage it.
     * Requirements: 8.6
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Drop the new columns; adresse_intervention stays (was added by earlier migration)
            $columns = [
                'latitude_client',
                'longitude_client',
                'duree_estimee_min',
                'source_acceptation',
                'source_devis',
                'source_validation',
                'source_terminaison',
            ];

            $existingColumns = array_filter(
                $columns,
                fn (string $col) => Schema::hasColumn('reservations', $col)
            );

            if (! empty($existingColumns)) {
                $table->dropColumn(array_values($existingColumns));
            }

            // Revert adresse_intervention back to VARCHAR(255) if it was already present
            if (Schema::hasColumn('reservations', 'adresse_intervention')) {
                $table->string('adresse_intervention', 255)->nullable()->change();
            }
        });
    }
};
