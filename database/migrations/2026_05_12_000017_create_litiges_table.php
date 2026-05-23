<?php
// database/migrations/2026_05_12_000017_create_litiges_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('litiges', function (Blueprint $table) {
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
            $table->text('description_litige');
            $table->dateTime('date_ouverture');
            $table->enum('statut', ['ouvert', 'en_cours', 'resolu', 'clos'])->default('ouvert');
            $table->text('resolution_details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('litiges');
    }
};