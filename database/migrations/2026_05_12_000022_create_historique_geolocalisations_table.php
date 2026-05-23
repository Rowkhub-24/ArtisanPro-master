<?php
// database/migrations/2026_05_12_000022_create_historique_geolocalisations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historique_geolocalisations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_artisan')
                  ->constrained('artisans')
                  ->onDelete('cascade');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->dateTime('date_position');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_geolocalisations');
    }
};