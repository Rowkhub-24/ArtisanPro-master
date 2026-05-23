<?php
// database/migrations/2026_05_12_000018_create_sinistres_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sinistres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_client')
                  ->constrained('clients')
                  ->onDelete('cascade');
            $table->foreignId('id_artisan')
                  ->constrained('artisans')
                  ->onDelete('cascade');
            $table->foreignId('id_reservation')
                  ->constrained('reservations')
                  ->onDelete('cascade');
            $table->text('description_sinistre');
            $table->dateTime('date_declaration');
            $table->enum('statut', ['declare', 'en_cours_traitement', 'resolu', 'refuse'])->default('declare');
            $table->text('details_resolution')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sinistres');
    }
};